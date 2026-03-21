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

export class FluxKontextMaxMulti implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Flux Kontext Max Multi',
		name: 'fluxKontextMaxMulti',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'An experimental multi-image approach to a premium text-to-image editing model, designed to maxi',
		defaults: {
			name: 'Wiro - Flux Kontext Max Multi',
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
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Image to use as reference. Must be jpeg, png.',
			},
			{
				displayName: 'Image Second URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Image to use as reference. Must be jpeg, png.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Text prompt for image generation',
			},
			{
				displayName: 'Prompt Upsampling',
				name: 'promptUpsampling',
				type: 'options',
				default: 'false',
				description: 'Whether to perform upsampling on the prompt. If active, automatically modifies the prompt for more creative generation.',
				options: [
					{ name: 'NO', value: 'false' },
					{ name: 'YES', value: 'true' },
				],
			},
			{
				displayName: 'Safety Tolerance',
				name: 'safetyTolerance',
				type: 'options',
				default: '2',
				description: 'Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.',
				options: [
					{ name: '2', value: '2' },
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
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'jpeg',
				description: 'Output format for the generated image. Can be \'jpeg\' or \'png\'.',
				options: [
					{ name: 'Jpeg', value: 'jpeg' },
					{ name: 'Png', value: 'png' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const promptUpsampling = this.getNodeParameter('promptUpsampling', 0, '') as string;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiroai/flux-kontext-max-multi',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				prompt,
				promptUpsampling,
				safetyTolerance,
				seed,
				outputFormat,
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
