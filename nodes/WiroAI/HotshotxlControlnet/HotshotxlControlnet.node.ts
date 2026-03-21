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

export class HotshotxlControlnet implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate GIF Advanced',
		name: 'hotshotxlControlnet',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Hotshot-XL is a tool that allows you to generate GIFs from given text. Additionally, it can be',
		defaults: {
			name: 'Wiro - Generate GIF Advanced',
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
				displayName: 'Select Controlnet Model (Upload Gif Image)',
				name: 'selectedControlnetModel',
				type: 'options',
				default: '',
				required: true,
				description: 'Select-controlnet-model-help',
				options: [
					{ name: '', value: '' },
				],
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
				displayName: 'Negativeprompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Negativeprompt-help',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '320x768',
				required: true,
				description: 'Select option for size',
				options: [
					{ name: 'Ratio: 0.42 | 320 X 768', value: '320x768' },
					{ name: 'Ratio: 0.57 | 384 X 672', value: '384x672' },
					{ name: 'Ratio: 0.68 | 416 X 608', value: '416x608' },
					{ name: 'Ratio: 1.00 | 512x512', value: '512x512' },
					{ name: 'Ratio: 1.46 | 608x416', value: '608x416' },
					{ name: 'Ratio: 1.75 | 672x384', value: '672x384' },
					{ name: 'Ratio: 2.40 | 768x320', value: '768x320' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Video Length',
				name: 'videoLength',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Video Duration',
				name: 'videoDuration',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Scheduler',
				name: 'scheduler',
				type: 'options',
				default: 'DDIMScheduler',
				description: 'Scheduler-help',
				options: [
					{ name: 'DDIMScheduler', value: 'DDIMScheduler' },
					{ name: 'DDPMScheduler', value: 'DDPMScheduler' },
					{ name: 'DPMSolverMultistepScheduler', value: 'DPMSolverMultistepScheduler' },
					{ name: 'EulerAncestralDiscreteScheduler', value: 'EulerAncestralDiscreteScheduler' },
					{ name: 'EulerDiscreteScheduler', value: 'EulerDiscreteScheduler' },
					{ name: 'FlowMatchEulerDiscreteScheduler', value: 'FlowMatchEulerDiscreteScheduler' },
					{ name: 'LMSDiscreteScheduler', value: 'LMSDiscreteScheduler' },
					{ name: 'PNDMScheduler', value: 'PNDMScheduler' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const selectedControlnetModel = this.getNodeParameter('selectedControlnetModel', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const size = this.getNodeParameter('size', 0) as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const videoLength = this.getNodeParameter('videoLength', 0, 0) as number;
		const videoDuration = this.getNodeParameter('videoDuration', 0, 0) as number;
		const scheduler = this.getNodeParameter('scheduler', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/hotshotxl-controlnet',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedControlnetModel,
				prompt,
				negativePrompt,
				steps,
				size,
				seed,
				videoLength,
				videoDuration,
				scheduler,
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
