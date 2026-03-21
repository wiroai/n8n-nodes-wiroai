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

export class ImageToVideoGen4Turbo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image To Video Gen4 Turbo',
		name: 'imageToVideoGen4Turbo',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Runway gen4-turbo model for image-to-video generation',
		defaults: {
			name: 'Wiro - Image To Video Gen4 Turbo',
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
				displayName: 'First Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'First frame of the video',
			},
			{
				displayName: 'Last Image URL',
				name: 'inputImageLastUrl',
				type: 'string',
				default: '',
				description: 'Last frame of the video',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1104:832',
				required: true,
				description: 'Generate video aspect ratio',
				options: [
					{ name: '1104:832', value: '1104:832' },
					{ name: '1280:720', value: '1280:720' },
					{ name: '1584:672', value: '1584:672' },
					{ name: '720:1280', value: '720:1280' },
					{ name: '832:1104', value: '832:1104' },
					{ name: '960:960', value: '960:960' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				description: 'Generated video duration in seconds',
				options: [
					{ name: '10', value: '10' },
					{ name: '5', value: '5' },
				],
			},
			{
				displayName: 'Public Figure Threshold',
				name: 'contentModeration',
				type: 'options',
				default: 'auto',
				description: 'When set to low, the content moderation system will be less strict about preventing generations that include recognizable public figures',
				options: [
					{ name: 'Auto', value: 'auto' },
					{ name: 'Low', value: 'low' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Seed integer to control the randomness of generated content',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputImageLastUrl = this.getNodeParameter('inputImageLastUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const duration = this.getNodeParameter('duration', 0, '') as string;
		const contentModeration = this.getNodeParameter('contentModeration', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/Runway/image-to-video-gen4-turbo',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImageLastUrl,
				prompt,
				ratio,
				duration,
				contentModeration,
				seed,
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
