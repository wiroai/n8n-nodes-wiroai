import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeApiError,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class Seedream4 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Seedream V4',
		name: 'seedream4',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Access the Seedream 4.0 API for fast high resolution image generation and editing. Simple integ',
		defaults: {
			name: 'Wiro - Seedream V4',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'wiroApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional list of input image URL(s) and/or file(s) for creating, editing or combining images',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Please provide how many images you want to generate in the prompt. Edit max images according to it.',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '1440x2560',
				required: true,
				description: 'Output image(s) resolution',
				options: [
					{ name: '1440x2560 (9:16)', value: '1440x2560' },
					{ name: '1664x2496 (2:3)', value: '1664x2496' },
					{ name: '1728x2304 (3:4)', value: '1728x2304' },
					{ name: '2048x2048 (1:1)', value: '2048x2048' },
					{ name: '2304x1728 (4:3)', value: '2304x1728' },
					{ name: '2496x1664 (3:2)', value: '2496x1664' },
					{ name: '2560x1440 (16:9)', value: '2560x1440' },
					{ name: '3024x1296 (21:9)', value: '3024x1296' },
				],
			},
			{
				displayName: 'Maximum Number Of Output Images',
				name: 'maxImages',
				type: 'number',
				default: 0,
				required: true,
				description: 'This is the limiter for number of outputs. Number of input reference images + Number of generated must be smaller then or equal to 15.',
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				required: true,
				description: 'Whether the generated image(s) contains a watermark',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const size = this.getNodeParameter('size', 0) as string;
		const maxImages = this.getNodeParameter('maxImages', 0) as number;
		const watermark = this.getNodeParameter('watermark', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/seedream-v4',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				size,
				maxImages,
				watermark,
			},
		});

		if (!response?.taskid || !response?.socketaccesstoken) {
			throw new NodeApiError(this.getNode(), {
				message:
					'Wiro API did not return a valid task ID or socket access token ' +
					JSON.stringify(response),
			});
		}

		const taskid = response.taskid;
		const socketaccesstoken = response.socketaccesstoken;

		const result = await pollTaskUntilComplete.call(this, socketaccesstoken, headers);

		const responseJSON = {
			taskid: taskid,
			url: '',
			status: '',
		};

		switch (result) {
			case '-1':
			case '-2':
			case '-3':
			case '-4':
				responseJSON.status = 'failed';
				break;
			default:
				responseJSON.status = 'completed';
				responseJSON.url = result ?? '';
		}

		returnData.push({
			json: responseJSON,
		});

		return [returnData];
	}
}
