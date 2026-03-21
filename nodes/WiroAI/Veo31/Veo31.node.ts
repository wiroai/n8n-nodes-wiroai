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

export class Veo31 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Veo3 1',
		name: 'veo31',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Access the Veo 3.1 API for high quality video generation with audio. View pricing, integration',
		defaults: {
			name: 'Wiro - Veo3 1',
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
				displayName: 'First Frame URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional. Input image for the first frame of the video.',
			},
			{
				displayName: 'Last Frame URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. Last frame of the video.',
			},
			{
				displayName: 'Reference Images URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Optional. Accepts 1 to 3 reference images. Duration will be 8 seconds by default. First and last images will be ignored',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Generate Audio',
				name: 'generateAudio',
				type: 'options',
				default: 'false',
				required: true,
				description: 'Generate audio for the video',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '16:9',
				description: 'Aspect ratio of the generated video',
				options: [
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
					{ name: 'Match Input Image', value: 'match_input_image' },
				],
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080p',
				description: 'Resolution of the generated video',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'A text string that describes anything you want to discourage the model from generating',
			},
			{
				displayName: 'Enhance Prompt',
				name: 'enhancePrompt',
				type: 'options',
				default: 'false',
				description: 'Use Gemini to enhance your prompts for better quality videos',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Person Generation',
				name: 'personGeneration',
				type: 'options',
				default: 'allow_adult',
				description: 'The safety setting that controls whether people or face generation is allowed. allow_adult: Allow generation of adults only. dont_allow: Disallow the inclusion of people or faces in videos',
				options: [
					{ name: 'Allow Adults', value: 'allow_adult' },
					{ name: 'Don\'t Allow', value: 'dont_allow' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'A number to make generated videos deterministic. For random result do not send.',
			},
			{
				displayName: 'Duration Seconds',
				name: 'durationSeconds',
				type: 'options',
				default: '4',
				required: true,
				description: 'Duration of the generated video in seconds. When using reference images duration is set to 8 by default.',
				options: [
					{ name: '4', value: '4' },
					{ name: '6', value: '6' },
					{ name: '8', value: '8' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const generateAudio = this.getNodeParameter('generateAudio', 0) as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const enhancePrompt = this.getNodeParameter('enhancePrompt', 0, '') as string;
		const personGeneration = this.getNodeParameter('personGeneration', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const durationSeconds = this.getNodeParameter('durationSeconds', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/veo3.1',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				prompt,
				generateAudio,
				aspectRatio,
				resolution,
				negativePrompt,
				enhancePrompt,
				personGeneration,
				seed,
				durationSeconds,
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
