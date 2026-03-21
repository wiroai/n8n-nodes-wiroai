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

export class Kling3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kling V3 Text-to-Video Generator',
		name: 'kling3',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create stunning videos from text prompts with Kling V3 AI. Customize frames, duration, and aspe',
		defaults: {
			name: 'Wiro - Kling V3 Text-to-Video Generator',
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
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'pro',
				required: true,
				description: 'Video mode. Std 720p, Pro 1080p.',
				options: [
					{ name: 'Pro', value: 'pro' },
					{ name: 'Std', value: 'std' },
				],
			},
			{
				displayName: 'First Frame URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional',
			},
			{
				displayName: 'Last Frame URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. Sound will be off.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Specify what to exclude from the output',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				required: true,
				description: 'Required. Total duration of the generated video (in seconds).',
				options: [
					{ name: '10 Seconds', value: '10' },
					{ name: '15 Seconds', value: '15' },
					{ name: '5 Seconds', value: '5' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'Ratio settings only apply to text-to-video; they are not supported in image-to-video mode',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Sound',
				name: 'sound',
				type: 'options',
				default: 'off',
				required: true,
				description: 'Optional. Default off. If there is last image then sound will be off',
				options: [
					{ name: 'Off', value: 'off' },
					{ name: 'On', value: 'on' },
				],
			},
			{
				displayName: 'Multi Shot',
				name: 'multiShot',
				type: 'options',
				default: 'false',
				description: 'Enable multi-shot video generation',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Shot Type',
				name: 'shotType',
				type: 'options',
				default: 'customize',
				description: 'Required when multiShot is true. Customize uses multiPrompt, intelligence uses prompt.',
				options: [
					{ name: 'Customize', value: 'customize' },
					{ name: 'Intelligence', value: 'intelligence' },
				],
			},
			{
				displayName: 'Multi Prompt',
				name: 'multiPrompt',
				type: 'string',
				default: '',
				description: 'Multi prompt JSON string. Required when shot type is customize. Must be an array of objects. Each object must have index(integer), prompt(string) and duration(string) fields. Video duration cannot exceed 15 seconds and total duration will be calculated from this object',
			},
			{
				displayName: 'CFG Scale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'CFG scale value between 0 and 1',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const mode = this.getNodeParameter('mode', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const sound = this.getNodeParameter('sound', 0) as string;
		const multiShot = this.getNodeParameter('multiShot', 0, '') as string;
		const shotType = this.getNodeParameter('shotType', 0, '') as string;
		const multiPrompt = this.getNodeParameter('multiPrompt', 0, '') as string;
		const scale = this.getNodeParameter('scale', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/kling-v3',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				mode,
				inputImageUrl,
				inputImage2Url,
				prompt,
				negativePrompt,
				duration,
				ratio,
				sound,
				multiShot,
				shotType,
				multiPrompt,
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
