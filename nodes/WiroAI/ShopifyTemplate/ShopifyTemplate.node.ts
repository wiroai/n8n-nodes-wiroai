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

export class ShopifyTemplate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Shopify Template Generator',
		name: 'shopifyTemplate',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create professional Shopify e-commerce templates using AI. Upload product images and choose fro',
		defaults: {
			name: 'Wiro - Shopify Template Generator',
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
				required: true,
				description: 'Required: Product photo',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'Required',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:3', value: '2:3' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '4:5', value: '4:5' },
					{ name: '5:4', value: '5:4' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Effect Type',
				name: 'effectType',
				type: 'string',
				default: '',
				required: true,
				description: 'Required',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const effectType = this.getNodeParameter('effectType', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Shopify Template',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				ratio,
				effectType,
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
