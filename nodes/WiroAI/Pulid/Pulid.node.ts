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

export class Pulid implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Pulid',
		name: 'pulid',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'PuLID is a tuning-free ID customization approach. PuLID maintains high ID fidelity while effect',
		defaults: {
			name: 'Wiro - Pulid',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
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
				displayName: 'ID Mix',
				name: 'idMix',
				type: 'boolean',
				default: false,
				description: 'Whether to enable ID mix (if you want to mix two ID image, please turn this on, otherwise, turn this off)',
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
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Numberofoutputs',
				name: 'samples',
				type: 'number',
				default: 0,
				description: 'Numberofoutputs-help',
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
				displayName: 'Fast Scale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'CFG, recommend value range [1, 1.5], 1 will be faster',
			},
			{
				displayName: 'ID Scale',
				name: 'IDscale',
				type: 'number',
				default: 0,
				description: 'ID-scale-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Style',
				name: 'style',
				type: 'options',
				default: 'extremely style',
				description: 'The style parameter value',
				options: [
					{ name: 'Extremely Style', value: 'extremely style' },
					{ name: 'Fidelity', value: 'fidelity' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const inputImage4Url = this.getNodeParameter('inputImage4Url', 0, '') as string;
		const idMix = this.getNodeParameter('idMix', 0, false) as boolean;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const IDscale = this.getNodeParameter('IDscale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const style = this.getNodeParameter('style', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/pulid',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				inputImage4Url,
				idMix,
				prompt,
				negativePrompt,
				steps,
				samples,
				width,
				height,
				scale,
				IDscale,
				seed,
				style,
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
