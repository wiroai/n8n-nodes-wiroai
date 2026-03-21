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

export class PortraitTransferSd implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Portrait Transfer Sd',
		name: 'portraitTransferSd',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates new portraits from a given photo using prompts, maintaining the original facial featu',
		defaults: {
			name: 'Wiro - Portrait Transfer Sd',
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
				displayName: 'Select Model',
				name: 'selectedModel',
				type: 'options',
				default: '',
				description: 'Select-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Select Model Private',
				name: 'selectedModelPrivate',
				type: 'options',
				default: '',
				description: 'Select-model-private-help',
				options: [
				],
			},
			{
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Input Image2 URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Input Image3 URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Input Image4 URL',
				name: 'inputImage4Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Input Image5 URL',
				name: 'inputImage5Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Prompt-help',
			},
			{
				displayName: 'Negativeprompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Negativeprompt-help',
			},
			{
				displayName: 'Numberofoutputs',
				name: 'samples',
				type: 'number',
				default: 0,
				description: 'Numberofoutputs-help',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width-help',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height-help',
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
					{ name: 'LMSDiscreteScheduler', value: 'LMSDiscreteScheduler' },
					{ name: 'PNDMScheduler', value: 'PNDMScheduler' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const selectedModel = this.getNodeParameter('selectedModel', 0, '') as string;
		const selectedModelPrivate = this.getNodeParameter('selectedModelPrivate', 0, '') as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const inputImage4Url = this.getNodeParameter('inputImage4Url', 0, '') as string;
		const inputImage5Url = this.getNodeParameter('inputImage5Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const scheduler = this.getNodeParameter('scheduler', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/portrait-transfer-sd',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel,
				selectedModelPrivate,
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				inputImage4Url,
				inputImage5Url,
				prompt,
				negativePrompt,
				samples,
				steps,
				scale,
				seed,
				width,
				height,
				scheduler,
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
