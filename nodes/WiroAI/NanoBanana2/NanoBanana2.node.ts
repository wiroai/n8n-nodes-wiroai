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

export class NanoBanana2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Nano-Banana-2 Image Editing Tool',
		name: 'nanoBanana2',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Nano-Banana-2 by Google enables fast image editing with multi-reference support. Ideal for crea',
		defaults: {
			name: 'Wiro - Nano-Banana-2 Image Editing Tool',
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
				description: 'Gemini 3.1 Flash Preview lets you to mix up to 14 reference images. These 14 images can include the following: Up to 10 images of objects with high-fidelity to include in the final image, up to 4 images of characters to maintain character consistency.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'The prompt to generate the image',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Aspect Ratio of the output image',
				options: [
					{ name: '1:1 (512)512x512 (1K)1024x1024 (2K)2048x2048 (4K)4096x4096', value: '1:1' },
					{ name: '1:4 (512)256x1024 (1K)512x2048 (2K)1024x4096 (4K)2048x8192', value: '1:4' },
					{ name: '1:8 (512)192x1536 (1K)384x3072 (2K)768x6144 (4K)1536x12288', value: '1:8' },
					{ name: '16:9 (512)688x384 (1K)1376x768 (2K)2752x1536 (4K)5504x3072', value: '16:9' },
					{ name: '2:3 (512)424x632 (1K)848x1264 (2K)1696x2528 (4K)3392x5056', value: '2:3' },
					{ name: '21:9 (512)792x168 (1K)1584x672 (2K)3168x1344 (4K)6336x2688', value: '21:9' },
					{ name: '3:2 (512)632x424 (1K)1264x848 (2K)2528x1696 (4K)5056x3392', value: '3:2' },
					{ name: '3:4 (512)448x600 (1K)896x1200 (2K)1792x2400 (4K)3584x4800', value: '3:4' },
					{ name: '4:1 (512)1024x256 (1K)2048x512 (2K)4096x1024 (4K)8192x2048', value: '4:1' },
					{ name: '4:3 (512)600x448 (1K)1200x896 (2K)2400x1792 (4K)4800x3584', value: '4:3' },
					{ name: '4:5 (512)464x576 (1K)928x1152 (2K)1856x2304 (4K)3712x4608', value: '4:5' },
					{ name: '5:4 (512)576x464 (1K)1152x928 (2K)2304x1856 (4K)4608x3712', value: '5:4' },
					{ name: '8:1 (512)1536x192 (1K)3072x384 (2K)6144x768 (4K)12288x1536', value: '8:1' },
					{ name: '9:16 (512)384x688 (1K)768x1376 (2K)1536x2752 (4K)3072x5504', value: '9:16' },
					{ name: 'Match Input Image', value: '' },
				],
			},
			{
				displayName: 'Resolution (K)',
				name: 'resolution',
				type: 'options',
				default: '1K',
				description: 'Default is 1K',
				options: [
					{ name: '1K (Standard)', value: '1K' },
					{ name: '2K (High)', value: '2K' },
					{ name: '4K (Ultra High)', value: '4K' },
					{ name: '512 (Standard)', value: '512' },
				],
			},
			{
				displayName: 'Safety Setting',
				name: 'safetySetting',
				type: 'options',
				default: 'BLOCK_LOW_AND_ABOVE',
				description: 'The safetySetting parameter value',
				options: [
					{ name: 'BLOCK LOW AND ABOVE', value: 'BLOCK_LOW_AND_ABOVE' },
					{ name: 'BLOCK MEDIUM AND ABOVE', value: 'BLOCK_MEDIUM_AND_ABOVE' },
					{ name: 'BLOCK NONE', value: 'BLOCK_NONE' },
					{ name: 'BLOCK ONLY HIGH', value: 'BLOCK_ONLY_HIGH' },
					{ name: 'OFF', value: 'OFF' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0, '') as string;
		const safetySetting = this.getNodeParameter('safetySetting', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/nano-banana-2',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				aspectRatio,
				resolution,
				safetySetting,
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
