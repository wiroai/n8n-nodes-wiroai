import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeApiError,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class Seedream5LiteUncensored implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Seedream v5 Lite Uncensored Image Generator',
		name: 'seedream5LiteUncensored',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create custom AI-generated images with Seedream v5 Lite Uncensored. Perfect for artists and des',
		defaults: {
			name: 'Wiro - Seedream v5 Lite Uncensored Image Generator',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
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
				description: 'Optional for i2i. Required for t2i. If image is provided it will get the first images dimensions and calculate it according to 3686400, 10404496 these pixel counts, if lower it will be scaled up, if higher it will be scaled down by the given images ratio',
				options: [
					{ name: '2k', value: '2k' },
					{ name: '3k', value: '3k' },
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
					{ name: '1:1 (2k: 2048x2048) (3k: 3072x3072)', value: '1:1' },
					{ name: '16:9 (2k: 2848x1600) (3k: 4096x2304)', value: '16:9' },
					{ name: '2:3 (2k: 1664x2496) (3k: 2496x3744)', value: '2:3' },
					{ name: '21:9 (2k: 3136x1344) (3k: 4704x2016)', value: '21:9' },
					{ name: '3:2 (2k: 2496x1664) (3k: 3744x2496)', value: '3:2' },
					{ name: '3:4 (2k: 1728x2304) (3k: 2592x3456)', value: '3:4' },
					{ name: '4:3 (2k: 2304x1728) (3k: 3456x2592)', value: '4:3' },
					{ name: '9:16 (2k: 1600x2848) (3k: 2304x4096)', value: '9:16' },
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
			url: 'https://api.wiro.ai/v1/Run/ByteDance/seedream-v5-lite-uncensored',
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
