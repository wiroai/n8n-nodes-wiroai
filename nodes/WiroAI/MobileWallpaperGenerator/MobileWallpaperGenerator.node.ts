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

export class MobileWallpaperGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate 4K Mobile Wallpapers',
		name: 'mobileWallpaperGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates 4K-quality mobile phone wallpapers using Wiro AI',
		defaults: {
			name: 'Wiro - Generate 4K-quality Mobile Wallpapers',
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
				default: 'minimal futuristic cityscape at sunset',
				required: true,
				description: 'Enter a description of what you want to create',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default:
					'low quality, blurry, distorted, text, signature, watermark, cropped, frame, borders, extra limbs, disfigured',
				required: true,
				description: 'Use this field to list anything you don’t want in your mobile wallpaper',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'string',
				default: '25',
				required: true,
				description: 'Give inference steps',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '3.5',
				required: true,
				description: 'Give guidance scale',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '687374032',
				required: true,
				description: 'Random seed for different generations',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'string',
				default: '576',
				required: true,
				description: 'Width of the output',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'string',
				default: '1024',
				required: true,
				description: 'Height of the output',
			},
			{
				displayName: 'Samples',
				name: 'samples',
				type: 'string',
				default: '1',
				required: true,
				description: 'Number of samples for your output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0) as string;
		const steps = this.getNodeParameter('steps', 0) as string;
		const scale = this.getNodeParameter('scale', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const width = this.getNodeParameter('width', 0) as string;
		const height = this.getNodeParameter('height', 0) as string;
		const samples = this.getNodeParameter('samples', 0) as string;

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

		returnData.push({ json: responseJSON });

		return [returnData];
	}
}
