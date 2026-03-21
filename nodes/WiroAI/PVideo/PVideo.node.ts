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

export class PVideo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - P-Video: Text-to-Video Generator',
		name: 'pVideo',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create stunning videos from text prompts with P-Video AI. Perfect for creators, marketers, and',
		defaults: {
			name: 'Wiro - P-Video: Text-to-Video Generator',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Text input for prompt',
			},
			{
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'URL of the file for input image URL',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				description: 'If input image is provided this will not take effect',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:3', value: '2:3' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 0,
				required: true,
				description: 'Required. Video length (1-10s). Ignored when audio is provided',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Required',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Fps',
				name: 'fps',
				type: 'options',
				default: '24',
				description: 'Select option for fps',
				options: [
					{ name: '24', value: '24' },
					{ name: '48', value: '48' },
				],
			},
			{
				displayName: 'Input Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Optional: Audio (flac, mp3, wav) to condition video',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed. Leave zero to randomize the seed.',
			},
			{
				displayName: 'Save Audio',
				name: 'saveAudio',
				type: 'options',
				default: 'false',
				description: 'Save the video with audio. This does not effect if audio file is provided.',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Draft Mode',
				name: 'draft',
				type: 'options',
				default: 'false',
				description: 'If set to true generates a lower-quality preview',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Prompt Upsampling',
				name: 'promptUpsampling',
				type: 'options',
				default: 'false',
				description: 'Automatically enhance your prompt',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as number;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const fps = this.getNodeParameter('fps', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const saveAudio = this.getNodeParameter('saveAudio', 0, '') as string;
		const draft = this.getNodeParameter('draft', 0, '') as string;
		const promptUpsampling = this.getNodeParameter('promptUpsampling', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/pruna/p-video',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				inputImageUrl,
				ratio,
				duration,
				resolution,
				fps,
				inputAudioUrl,
				seed,
				saveAudio,
				draft,
				promptUpsampling,
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
