import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionType,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class FluxKontextMax implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image-to-Image (Flux Kontext Max)',
		name: 'fluxKontextMax',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description:
			'Enhances product or object imagery for clean, e-commerce-ready visuals via Flux Kontext Max',
		defaults: {
			name: 'Wiro - Image-to-Image (Flux Kontext Max)',
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
				displayName: 'Enter Your Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Choose an image to enhance with clean lighting',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default:
					'Enhance the cookie package with clean lighting and a white background, perfect for e-commerce display.',
				required: true,
				description: "Describe how you'd like the image to be transformed",
			},
			{
				displayName: 'Prompt Upsampling',
				name: 'promptUpsampling',
				type: 'boolean',
				default: false,
				description: 'Whether to improve prompt detail quality',
			},
			{
				displayName: 'Safety Tolerance',
				name: 'safetyTolerance',
				type: 'string',
				default: '2',
				description: 'Set the safety filter level (e.g. 1 = strict, 2 = normal, 3 = loose)',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '',
				description: 'Define the aspect ratio like 16:9, 1:1, etc',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '1:2', value: '1:2' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:1', value: '2:1' },
					{ name: '2:3', value: '2:3' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '4:5', value: '4:5' },
					{ name: '5:4', value: '5:4' },
					{ name: '9:16', value: '9:16' },
					{ name: '9:21', value: '9:21' },
					{ name: 'Match Input Image', value: '' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '4730063',
				description: 'Set a fixed seed for reproducibility',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'string',
				default: 'jpeg',
				description: 'Specify output format like jpeg or png',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const promptUpsampling = this.getNodeParameter('promptUpsampling', 0) as boolean;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0) as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0) as string;

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/black-forest-labs/flux-kontext-max',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				promptUpsampling,
				safetyTolerance,
				aspectRatio,
				seed,
				outputFormat,
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
