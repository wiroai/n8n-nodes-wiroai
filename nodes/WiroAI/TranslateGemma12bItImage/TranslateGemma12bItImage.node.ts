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

export class TranslateGemma12bItImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Translate Gemma 12B It Image',
		name: 'translateGemma12bItImage',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'TranslateGemma is a family of lightweight, state-of-the-art open translation models from Google',
		defaults: {
			name: 'Wiro - Translate Gemma 12B It Image',
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
				description: 'URL of the file for input image URL',
			},
			{
				displayName: 'Source Language',
				name: 'sourceLng',
				type: 'string',
				default: '',
				description: 'Value for source language',
			},
			{
				displayName: 'Target Language',
				name: 'targetLng',
				type: 'string',
				default: '',
				description: 'Value for target language',
			},
			{
				displayName: 'Maximum New Tokens',
				name: 'maxNewTokens',
				type: 'number',
				default: 0,
				description: 'Numeric value for maximum new tokens',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const sourceLng = this.getNodeParameter('sourceLng', 0, '') as string;
		const targetLng = this.getNodeParameter('targetLng', 0, '') as string;
		const maxNewTokens = this.getNodeParameter('maxNewTokens', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/translate-gemma-12b-it-image',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				sourceLng,
				targetLng,
				maxNewTokens,
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
