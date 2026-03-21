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

export class OmniZeroCouple implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Omni Zero Couple',
		name: 'omniZeroCouple',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Omni-Zero Couples: A diffusion pipeline for zero-shot stylized couples portrait creation',
		defaults: {
			name: 'Wiro - Omni Zero Couple',
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
				displayName: 'Base Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Style Image URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Identity Image 1 URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Identity Image 2 URL',
				name: 'inputImage4Url',
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
				displayName: 'Base Image Strength',
				name: 'baseImageStrength',
				type: 'number',
				default: 0,
				required: true,
				description: 'Numeric value for base image strength',
			},
			{
				displayName: 'Style Image Strength',
				name: 'styleImageStrength',
				type: 'number',
				default: 0,
				required: true,
				description: 'Numeric value for style image strength',
			},
			{
				displayName: 'Identity Image1Strength',
				name: 'identityImage1Strength',
				type: 'number',
				default: 0,
				required: true,
				description: 'Numeric value for identity image1strength',
			},
			{
				displayName: 'Identity Image2Strength',
				name: 'identityImage2Strength',
				type: 'number',
				default: 0,
				required: true,
				description: 'Numeric value for identity image2strength',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const inputImage4Url = this.getNodeParameter('inputImage4Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const baseImageStrength = this.getNodeParameter('baseImageStrength', 0) as number;
		const styleImageStrength = this.getNodeParameter('styleImageStrength', 0) as number;
		const identityImage1Strength = this.getNodeParameter('identityImage1Strength', 0) as number;
		const identityImage2Strength = this.getNodeParameter('identityImage2Strength', 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/omni_zero_couple',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				inputImage4Url,
				prompt,
				negativePrompt,
				samples,
				steps,
				scale,
				seed,
				width,
				height,
				baseImageStrength,
				styleImageStrength,
				identityImage1Strength,
				identityImage2Strength,
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
