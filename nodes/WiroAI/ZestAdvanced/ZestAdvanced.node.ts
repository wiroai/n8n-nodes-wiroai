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

export class ZestAdvanced implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Zest Advanced',
		name: 'zestAdvanced',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Zest is a tool for material transfer to an object in the input image. The difference between th',
		defaults: {
			name: 'Wiro - Zest Advanced',
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
				displayName: 'Select Controlnet Model',
				name: 'selectedControlnetModel',
				type: 'multiOptions',
				default: [],
				description: 'Select-controlnet-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Controlnet Preprocess',
				name: 'preprocess',
				type: 'boolean',
				default: false,
				description: 'Whether to enable controlnet-preprocess-help',
			},
			{
				displayName: 'Input Image Pattern URL',
				name: 'inputImagePatternUrl',
				type: 'string',
				default: '',
				description: 'Input-image-pattern-help',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
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
		const selectedControlnetModel = this.getNodeParameter('selectedControlnetModel', 0, '') as string;
		const preprocess = this.getNodeParameter('preprocess', 0, false) as boolean;
		const inputImagePatternUrl = this.getNodeParameter('inputImagePatternUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const scheduler = this.getNodeParameter('scheduler', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/zest-advanced',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel,
				selectedModelPrivate,
				selectedControlnetModel,
				preprocess,
				inputImagePatternUrl,
				prompt,
				negativePrompt,
				samples,
				steps,
				scale,
				seed,
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
