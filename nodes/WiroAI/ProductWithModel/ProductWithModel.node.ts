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

export class ProductWithModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Product Model Video Generator',
		name: 'productWithModel',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create stunning product videos with AI. Add models to products in custom scenes. Perfect for e-',
		defaults: {
			name: 'Wiro - Product Model Video Generator',
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
				displayName: 'Product Images URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Required if composed image is not provided. One of product images or composed image must be supplied. Maximum 10 images allowed',
			},
			{
				displayName: 'Model Image URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. Only used with product image. Disregarded if composed image is provided',
			},
			{
				displayName: 'Background Image URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Optional. Can be used with product image or composed image.',
			},
			{
				displayName: 'Composed Image URL',
				name: 'inputImage4Url',
				type: 'string',
				default: '',
				description: 'Optional. This is a field for where model and product in the same image. Can be used alone or with background image. If background image is omitted then this will generate video output directly. If provided, product image and model image will be disregarded',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				description: 'Required. Default 9:16.',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
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

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const inputImage4Url = this.getNodeParameter('inputImage4Url', 0, '') as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const effectType = this.getNodeParameter('effectType', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Product with Model',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				inputImage4Url,
				ratio,
				effectType,
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
