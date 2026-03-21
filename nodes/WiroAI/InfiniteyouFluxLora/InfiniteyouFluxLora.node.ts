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

export class InfiniteyouFluxLora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Infiniteyou Flux Lora',
		name: 'infiniteyouFluxLora',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'InfiniteYou-Flux-LoRA extends InfiniteYou with LoRA fine-tuning capabilities for even deeper pe',
		defaults: {
			name: 'Wiro - Infiniteyou Flux Lora',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Init-image-help',
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
				displayName: 'Samples',
				name: 'samples',
				type: 'number',
				default: 0,
				description: 'Samples-help',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const selectedLoraModel = this.getNodeParameter('selectedLoraModel', 0, '') as string;
		const selectedLoraModelPrivate = this.getNodeParameter('selectedLoraModelPrivate', 0, '') as string;
		const selectedLoraModelPrivateUrl = this.getNodeParameter('selectedLoraModelPrivateUrl', 0, '') as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/InfiniteYou-flux-lora',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedLoraModel,
				selectedLoraModelPrivate,
				selectedLoraModelPrivateUrl,
				inputImageUrl,
				prompt,
				steps,
				scale,
				samples,
				seed,
				width,
				height,
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
