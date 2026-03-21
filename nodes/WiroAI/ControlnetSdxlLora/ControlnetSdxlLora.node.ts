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

export class ControlnetSdxlLora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Controlnet Sdxl Lora',
		name: 'controlnetSdxlLora',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'SDXL ControlNet is a neural network structure to control diffusion models by adding extra condi',
		defaults: {
			name: 'Wiro - Controlnet Sdxl Lora',
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
				displayName: 'Select Lora Model',
				name: 'selectedLoraModel',
				type: 'options',
				default: '',
				description: 'Select-lora-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Select Lora Model Private',
				name: 'selectedLoraModelPrivate',
				type: 'options',
				default: '',
				description: 'Select-lora-model-private-help',
				options: [
				],
			},
			{
				displayName: 'Lo RA Model Url',
				name: 'selectedLoraModelPrivateUrl',
				type: 'string',
				default: '',
				description: 'You can provide a direct URL to a LoRA model (.safetensors). We’ll apply it during generation. You can also use links from platforms like Google Drive, AWS S3, or any publicly accessible file host',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const selectedModel = this.getNodeParameter('selectedModel', 0, '') as string;
		const selectedModelPrivate = this.getNodeParameter('selectedModelPrivate', 0, '') as string;
		const selectedLoraModel = this.getNodeParameter('selectedLoraModel', 0, '') as string;
		const selectedLoraModelPrivate = this.getNodeParameter('selectedLoraModelPrivate', 0, '') as string;
		const selectedLoraModelPrivateUrl = this.getNodeParameter('selectedLoraModelPrivateUrl', 0, '') as string;
		const selectedControlnetModel = this.getNodeParameter('selectedControlnetModel', 0, '') as string;
		const preprocess = this.getNodeParameter('preprocess', 0, false) as boolean;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const scheduler = this.getNodeParameter('scheduler', 0, '') as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/controlnet-sdxl-lora',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel,
				selectedModelPrivate,
				selectedLoraModel,
				selectedLoraModelPrivate,
				selectedLoraModelPrivateUrl,
				selectedControlnetModel,
				preprocess,
				prompt,
				negativePrompt,
				samples,
				steps,
				scale,
				seed,
				scheduler,
				width,
				height,
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
