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

export class Kling3Omni implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kling V3 Omni',
		name: 'kling3Omni',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create stunning videos with Kling V3 Omni AI. Generate 1080p videos with prompt and images, ima',
		defaults: {
			name: 'Wiro - Kling V3 Omni',
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
					{ name: 'Pro (1080p)', value: 'pro' },
					{ name: 'Std (720p)', value: 'std' },
				],
			},
			{
				displayName: 'First Frame URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional. When generating a video using the first frame or the first and last frames, video editing functions cannot be used.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Last Frame URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. When end frame provided sound will be off. Only end frame is not supported. When generating a video using the first frame or the first and last frames, video editing functions cannot be used',
			},
			{
				displayName: 'Reference Images URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Optional. If there is no video 7 images allowed, if there is reference video then 4 images allowed.',
			},
			{
				displayName: 'Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				description: 'Optional',
			},
			{
				displayName: 'Video Refer Type',
				name: 'referType',
				type: 'options',
				default: 'base',
				description: 'Required if video is provided. If feature is selected it will be used as reference video, if base is selected then video will be edited.',
				options: [
					{ name: 'Base', value: 'base' },
					{ name: 'Feature', value: 'feature' },
				],
			},
			{
				displayName: 'Video Original Sound',
				name: 'originalSound',
				type: 'options',
				default: 'no',
				description: 'Required if video is provided. If refer type is feature then it will be no by default.',
				options: [
					{ name: 'No', value: 'no' },
					{ name: 'Yes', value: 'yes' },
				],
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
				type: 'number',
				default: 0,
				required: true,
				description: 'Required. Total duration of the generated video (in seconds).',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'Required',
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
				description: 'Required. Default off. If there is last image then sound will be off',
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
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0, '') as string;
		const referType = this.getNodeParameter('referType', 0, '') as string;
		const originalSound = this.getNodeParameter('originalSound', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as number;
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

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/kling-v3-omni',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				mode,
				inputImageUrl,
				prompt,
				inputImage2Url,
				inputImage3Url,
				inputVideoUrl,
				referType,
				originalSound,
				negativePrompt,
				duration,
				ratio,
				sound,
				multiShot,
				shotType,
				multiPrompt,
				scale,
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
