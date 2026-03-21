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

export class Mmaudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - MMAudio - Video to Audio Generator',
		name: 'mmaudio',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'MMAudio generates synchronized audio for videos using AI. Enhance video content with matching s',
		defaults: {
			name: 'Wiro - MMAudio - Video to Audio Generator',
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
				displayName: 'Input Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				description: 'Upload a video file to generate synchronized audio. The model will analyze visual content and create matching sound effects. Maximum 30 seconds. If no video is provided, the model switches to text-to-audio mode',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Describe the audio you want to generate. For video input: enhances the generated audio with specific sounds or leave empty. For text-to-audio mode: required description of the audio to create',
			},
			{
				displayName: 'Negativeprompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Describe sounds to avoid in the generated audio. Helps filter out unwanted elements like background noise, distortion, or specific sounds you don\'t want.',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Number of denoising steps. Higher values produce better quality audio but take longer.',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 0,
				description: 'Audio duration in seconds. Only used in text-to-audio mode (when no video is provided). When a video is uploaded, duration is automatically set to match the video length',
			},
			{
				displayName: 'Strength',
				name: 'strength',
				type: 'number',
				default: 0,
				description: 'Controls how strongly the model follows the text prompt. Higher values = more prompt influence. Lower values = more natural/subtle results. Recommended: 4.0-5.0',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed for reproducibility. Use the same seed to generate identical results. Change for variations',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const duration = this.getNodeParameter('duration', 0, 0) as number;
		const strength = this.getNodeParameter('strength', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/mmaudio',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				prompt,
				negativePrompt,
				steps,
				duration,
				strength,
				seed,
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
