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

export class TranslateGemma27bIt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Translate Gemma 27B It',
		name: 'translateGemma27bIt',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Access Translate Gemma 27B API by Google on Wiro. Simple integration, transparent pricing, and',
		defaults: {
			name: 'Wiro - Translate Gemma 27B It',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Prompt-help',
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

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const sourceLng = this.getNodeParameter('sourceLng', 0, '') as string;
		const targetLng = this.getNodeParameter('targetLng', 0, '') as string;
		const maxNewTokens = this.getNodeParameter('maxNewTokens', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/translate-gemma-27b-it',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				sourceLng,
				targetLng,
				maxNewTokens,
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
