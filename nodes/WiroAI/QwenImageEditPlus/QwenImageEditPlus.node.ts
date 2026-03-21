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

export class QwenImageEditPlus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Qwen Image Edit Plus',
		name: 'qwenImageEditPlus',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Qwen Image Edit Plus powered by Pruna AI',
		defaults: {
			name: 'Wiro - Qwen Image Edit Plus',
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
				required: true,
				description: 'Accepts up to 2 images',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Text input for prompt',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Select option for aspect ratio',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
					{ name: 'Match Input Image', value: 'match_input_image' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed. Leave zero to randomize the seed.',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'jpg',
				description: 'Select option for output format',
				options: [
					{ name: 'Jpg', value: 'jpg' },
					{ name: 'Png', value: 'png' },
					{ name: 'Webp', value: 'webp' },
				],
			},
			{
				displayName: 'Output Quality',
				name: 'outputQuality',
				type: 'string',
				default: '',
				description: 'Quality for jpg/webp (1-100)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;
		const outputQuality = this.getNodeParameter('outputQuality', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/pruna/qwen-image-edit-plus',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				aspectRatio,
				seed,
				outputFormat,
				outputQuality,
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
