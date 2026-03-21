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

export class TextToImageSeedream3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Image Seedream V3',
		name: 'textToImageSeedream3',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Use the Seedream 3.0 API for fast high resolution bilingual image generation. Simple integratio',
		defaults: {
			name: 'Wiro - Text To Image Seedream V3',
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
				description: 'Text input for prompt',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '1024x1024',
				required: true,
				description: 'Video resolution',
				options: [
					{ name: '1024x1024 (1:1)', value: '1024x1024' },
					{ name: '1152x864 (4:3)', value: '1152x864' },
					{ name: '1248x832 (3:2)', value: '1248x832' },
					{ name: '1280x720 (16:9)', value: '1280x720' },
					{ name: '1512x648 (21:9)', value: '1512x648' },
					{ name: '720x1280 (9:16)', value: '720x1280' },
					{ name: '832x1248 (2:3)', value: '832x1248' },
					{ name: '864x1152 (3:4)', value: '864x1152' },
				],
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				required: true,
				description: 'Generate whether the video contains a watermark',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Guidance Scale',
				name: 'guidanceScale',
				type: 'number',
				default: 0,
				required: true,
				description: 'Controls how closely the output image aligns with the input prompt. The higher the value, the less freedom the model has, and the stronger the prompt correlation.',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				required: true,
				description: 'Seed integer to control the randomness of generated content. Set 0 to random.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const size = this.getNodeParameter('size', 0) as string;
		const watermark = this.getNodeParameter('watermark', 0) as string;
		const guidanceScale = this.getNodeParameter('guidanceScale', 0) as number;
		const seed = this.getNodeParameter('seed', 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/text-to-image-seedream-v3',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				size,
				watermark,
				guidanceScale,
				seed,
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
