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

export class StableDiffusionWithLlm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Stable Diffusion With Llm',
		name: 'stableDiffusionWithLlm',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Using Stable Diffusion together with an LLM provides more control over the generated images',
		defaults: {
			name: 'Wiro - Stable Diffusion With Llm',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Prompt-help',
			},
			{
				displayName: 'Background Prompt',
				name: 'background_prompt',
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
				displayName: 'Canvas',
				name: 'canvas',
				type: 'string',
				default: '',
				required: true,
				description: 'Canvas-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Numberofoutputs',
				name: 'samples',
				type: 'number',
				default: 0,
				description: 'Numberofoutputs-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const background_prompt = this.getNodeParameter('background_prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const canvas = this.getNodeParameter('canvas', 0) as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/stable-diffusion-with-llm',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				background_prompt,
				negativePrompt,
				canvas,
				seed,
				samples,
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
