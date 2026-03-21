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

export class Wan26 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Wan 2.6 Video Generation Model',
		name: 'wan26',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create AI-generated videos with Wan 2.6. Transform text or images into dynamic video content. P',
		defaults: {
			name: 'Wiro - Wan 2.6 Video Generation Model',
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
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'pro',
				required: true,
				description: 'Required. t2v model does not have std or pro mode.',
				options: [
					{ name: 'Pro', value: 'pro' },
					{ name: 'Std', value: 'std' },
				],
			},
			{
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional. If image is provided ratio will be determined by the model.',
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
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Specify what to exclude from the output',
			},
			{
				displayName: 'Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Optional. r2v model does not accept audio file. If provided audioEnabled will be true by default',
			},
			{
				displayName: 'References URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. For r2v only. Provide reference images to extract character appearance and voice. Limits: 0-5 images. Order matters: first = character1, second = character2, etc. Each file must contain only one main character. Each reference file must contain only one main character. For example, character1 is a little girl, and character2 is an alarm clock',
			},
			{
				displayName: 'Enabled Audio',
				name: 'audioEnabled',
				type: 'options',
				default: 'false',
				description: 'Optional. If mode is pro, it will be set to true by default. Only allowed in image to video generation',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
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
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080P',
				required: true,
				description: 'Required. Quality tier for the generated video.',
				options: [
					{ name: '1080P', value: '1080P' },
					{ name: '720P', value: '720P' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				description: 'Required for text to video and reference to video. If image is provided this will not take effect, model will try to match the closest ratio.',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Shot Type',
				name: 'shotType',
				type: 'options',
				default: 'multi',
				description: 'Enable multi-shot video generation',
				options: [
					{ name: 'Multi', value: 'multi' },
					{ name: 'Single', value: 'single' },
				],
			},
			{
				displayName: 'Prompt Extend',
				name: 'promptExtend',
				type: 'options',
				default: 'false',
				description: 'Optional. Required to be true if Multi Shot is enabled for i2v/t2v. Not used for r2v',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				description: 'Optional. Add \'AI Generated\' watermark in the lower-right corner.',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Optional. Random seed for reproducibility (0-21474836).',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const mode = this.getNodeParameter('mode', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const audioEnabled = this.getNodeParameter('audioEnabled', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as number;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const shotType = this.getNodeParameter('shotType', 0, '') as string;
		const promptExtend = this.getNodeParameter('promptExtend', 0, '') as string;
		const watermark = this.getNodeParameter('watermark', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/alibaba/wan 2.6',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				mode,
				inputImageUrl,
				prompt,
				negativePrompt,
				inputAudioUrl,
				inputImage2Url,
				audioEnabled,
				duration,
				resolution,
				ratio,
				shotType,
				promptExtend,
				watermark,
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
