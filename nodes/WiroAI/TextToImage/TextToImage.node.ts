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

export class TextToImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Convert Text to Image',
		name: 'textToImage',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Converts texts to images using Wiro AI',
		defaults: {
			name: 'Wiro - Convert Text to Image',
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
				required: true,
				description: 'Enter a description of what you want to see',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Things you do NOT want in the image',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'string',
				default: '25',
				required: true,
				description: 'Inference steps to generate the image',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '3.5',
				required: true,
				description: 'Guidance scale for image generation',
			},
			{
				displayName: 'Samples',
				name: 'samples',
				type: 'string',
				default: '1',
				required: true,
				description: 'Number of output images',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '1849728585',
				required: true,
				description: 'Random seed for reproducibility',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'string',
				default: '1024',
				required: true,
				description: 'Width of the output image',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'string',
				default: '1024',
				required: true,
				description: 'Height of the output image',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0) as string;
		const steps = this.getNodeParameter('steps', 0) as string;
		const scale = this.getNodeParameter('scale', 0) as string;
		const samples = this.getNodeParameter('samples', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const width = this.getNodeParameter('width', 0) as string;
		const height = this.getNodeParameter('height', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/text-to-image-sana',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel: '748',
				prompt,
				negativePrompt,
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
