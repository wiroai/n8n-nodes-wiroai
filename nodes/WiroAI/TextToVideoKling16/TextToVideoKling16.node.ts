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

export class TextToVideoKling16 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text to Video (KlingAI 1.6)',
		name: 'textToVideoKling16',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates high-quality video from text prompts using KlingAI',
		defaults: {
			name: 'Wiro - Text to Video (KlingAI 1.6)',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Describe what the video should show',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: 'blurry, distorted, bad anatomy',
				description: 'Describe what you do NOT want to appear in the video',
			},
			{
				displayName: 'Video Duration (Seconds)',
				name: 'videoSeconds',
				type: 'options',
				default: '5',
				required: true,
				description: 'Length of the generated video in seconds',
				options: [
					{ name: '5s', value: '5' },
					{ name: '10s', value: '10' },
				],
			},
			{
				displayName: 'Video Mode',
				name: 'videoMode',
				type: 'options',
				default: 'std',
				required: true,
				description: 'Select video generation mode (e.g., std, pro)',
				options: [
					{ name: 'Standart', value: 'std' },
					{ name: 'Professional', value: 'pro' },
				],
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '0.5',
				description: 'Classifier-free guidance scale',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0) as string;
		const videoSeconds = this.getNodeParameter('videoSeconds', 0) as string;
		const videoMode = this.getNodeParameter('videoMode', 0) as string;
		const scale = this.getNodeParameter('scale', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/text-to-video-klingai-v1++6',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				negativePrompt,
				videoSeconds,
				videoMode,
				scale,
			},
			json: true,
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
