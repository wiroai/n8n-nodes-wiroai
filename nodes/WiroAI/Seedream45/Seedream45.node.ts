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

export class Seedream45 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Seedream V4 5',
		name: 'seedream45',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Access the Seedream 4.5 API for fast high resolution image generation and editing. Simple integ',
		defaults: {
			name: 'Wiro - Seedream V4 5',
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
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '2k',
				description: 'Optional for i2i. Required for t2i. If image is provided it will get the first images dimensions and calculate it according to 3686400, 16777216 these pixel counts, if lower it will be scaled up, if higher it will be scaled down by the given images ratio',
				options: [
					{ name: '2k', value: '2k' },
					{ name: '4k', value: '4k' },
					{ name: 'Auto', value: '' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Optional for i2i, Required for t2i. If image(s) provided it will get the image/first image ratio.',
				options: [
					{ name: '1:1 (2K: 1920x1920 | 4K: 2880x2880)', value: '1:1' },
					{ name: '16:9 (2K: 2560x1440 | 4K: 3840x2160)', value: '16:9' },
					{ name: '2:3 (2K: 1566x2349 | 4K: 2349x3523)', value: '2:3' },
					{ name: '21:9 (2K: 2782x1192 | 4K: 4176x1789)', value: '21:9' },
					{ name: '3:2 (2K: 2349x1566 | 4K: 3523x2349)', value: '3:2' },
					{ name: '3:4 (2K: 1664x2218 | 4K: 2496x3328)', value: '3:4' },
					{ name: '4:3 (2K: 2218x1664 | 4K: 3328x2496)', value: '4:3' },
					{ name: '4:5 (2K: 1713x2141 | 4K: 2571x3213)', value: '4:5' },
					{ name: '5:4 (2K: 2141x1713 | 4K: 3213x2571)', value: '5:4' },
					{ name: '9:16 (2K: 1440x2560 | 4K: 2160x3840)', value: '9:16' },
					{ name: '9:21 (2K: 1192x2782 | 4K: 1789x4176)', value: '9:21' },
					{ name: 'Auto', value: '' },
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
		const resolution = this.getNodeParameter('resolution', 0, '') as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const maxImages = this.getNodeParameter('maxImages', 0) as number;
		const watermark = this.getNodeParameter('watermark', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/seedream-v4-5',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				resolution,
				aspectRatio,
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
