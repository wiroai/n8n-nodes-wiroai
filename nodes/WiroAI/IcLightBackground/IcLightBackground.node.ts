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

export class IcLightBackground implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ic Light Background',
		name: 'icLightBackground',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'More Lighting! IC-Light is used to manipulate the illumination of images using a background-con',
		defaults: {
			name: 'Wiro - Ic Light Background',
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
				displayName: 'Background Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Background-image-help',
			},
			{
				displayName: 'Foreground Image URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Foreground-image-help',
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
				displayName: 'Highres Scale',
				name: 'highres_scale',
				type: 'number',
				default: 0,
				description: 'Highres-scale-help',
			},
			{
				displayName: 'Highres Denoise',
				name: 'highres_denoise',
				type: 'number',
				default: 0,
				description: 'Highres-denoise-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Bg Source',
				name: 'bg_source',
				type: 'options',
				default: 'Use Background Image',
				description: 'Bg-source-help',
				options: [
					{ name: 'Use Background Image', value: 'Use Background Image' },
					{ name: 'Use Flipped Background Image', value: 'Use Flipped Background Image' },
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
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const highres_scale = this.getNodeParameter('highres_scale', 0, 0) as number;
		const highres_denoise = this.getNodeParameter('highres_denoise', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const bg_source = this.getNodeParameter('bg_source', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/ic-light-background',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel,
				selectedModelPrivate,
				inputImageUrl,
				inputImage2Url,
				prompt,
				negativePrompt,
				samples,
				steps,
				scale,
				highres_scale,
				highres_denoise,
				seed,
				bg_source,
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
