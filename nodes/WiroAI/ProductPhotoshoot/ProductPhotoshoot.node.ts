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

export class ProductPhotoshoot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Product Photoshoot',
		name: 'productPhotoshoot',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Save time and production costs with AI Product Photoshoot. Generate polished product images fea',
		defaults: {
			name: 'Wiro - Product Photoshoot',
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
				displayName: 'Product Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Upload the product image to generate a professional photoshoot',
			},
			{
				displayName: 'Photography Style',
				name: 'style',
				type: 'options',
				default: 'auto',
				description: 'Choose the photography style and environment for the product photoshoot. Default is auto.',
				options: [
					{ name: 'Auto (AI Selects Best Style)', value: 'auto' },
					{ name: 'Editorial', value: 'editorial' },
					{ name: 'Flat Lay', value: 'flat-lay' },
					{ name: 'Lifestyle Setting', value: 'lifestyle' },
					{ name: 'Luxury', value: 'luxury' },
					{ name: 'Minimalist', value: 'minimalist' },
					{ name: 'Outdoor', value: 'outdoor' },
					{ name: 'Studio Photography', value: 'studio' },
				],
			},
			{
				displayName: 'Shot Type',
				name: 'plan',
				type: 'options',
				default: 'action-shot',
				description: 'Choose the shot composition and framing for the product photograph. Default is auto.',
				options: [
					{ name: 'Action Shot (Product In Use)', value: 'action-shot' },
					{ name: 'Auto (AI Selects Best Composition)', value: 'auto' },
					{ name: 'Close Up (Detail Shot)', value: 'close-up' },
					{ name: 'Hero Shot (Main Product)', value: 'hero-shot' },
					{ name: 'Packaging Shot', value: 'packaging' },
					{ name: 'Scale Context (With Size Reference)', value: 'scale-context' },
				],
			},
			{
				displayName: 'Output Type',
				name: 'outputType',
				type: 'options',
				default: 'image',
				description: 'Select option for output type',
				options: [
					{ name: 'Image', value: 'image' },
					{ name: 'Image & Video', value: 'both' },
					{ name: 'Video', value: 'video' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const style = this.getNodeParameter('style', 0, '') as string;
		const plan = this.getNodeParameter('plan', 0, '') as string;
		const outputType = this.getNodeParameter('outputType', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Product Photoshoot',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				style,
				plan,
				outputType,
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
