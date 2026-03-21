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

export class Gemini3Pro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Gemini 3 Pro - Google AI Model',
		name: 'gemini3Pro',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Gemini 3 Pro by Google is an advanced AI model for complex reasoning and natural language tasks',
		defaults: {
			name: 'Wiro - Gemini 3 Pro - Google AI Model',
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
				displayName: 'Input Files URL',
				name: 'inputAllUrl',
				type: 'string',
				default: '',
				description: 'Optional. Multiple files separated by semicolon. Supports images, videos, and audio',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Required',
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Required for chat history. Numeric or string ID.',
			},
			{
				displayName: 'Session ID',
				name: 'session_id',
				type: 'string',
				default: '',
				description: 'Required for chat history. Numeric or string ID.',
			},
			{
				displayName: 'System Instructions',
				name: 'systemInstructions',
				type: 'string',
				default: '',
				description: 'Optional. System-level instructions for the model.',
			},
			{
				displayName: 'Thinking Level',
				name: 'thinkingLevel',
				type: 'options',
				default: 'high',
				description: 'Optional',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Minimal', value: 'minimal' },
				],
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				description: 'Optional. Controls randomness. Range: 0.0-2.0',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 0,
				description: 'Optional. Nucleus sampling. Range: 0.0-1.0',
			},
			{
				displayName: 'Max Output Tokens',
				name: 'maxOutputTokens',
				type: 'number',
				default: 0,
				description: 'Optional. Maximum response length. Range: 1-65536',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputAllUrl = this.getNodeParameter('inputAllUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const user_id = this.getNodeParameter('user_id', 0, '') as string;
		const session_id = this.getNodeParameter('session_id', 0, '') as string;
		const systemInstructions = this.getNodeParameter('systemInstructions', 0, '') as string;
		const thinkingLevel = this.getNodeParameter('thinkingLevel', 0, '') as string;
		const temperature = this.getNodeParameter('temperature', 0, 0) as number;
		const topP = this.getNodeParameter('topP', 0, 0) as number;
		const maxOutputTokens = this.getNodeParameter('maxOutputTokens', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/gemini-3-pro',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputAllUrl,
				prompt,
				user_id,
				session_id,
				systemInstructions,
				thinkingLevel,
				temperature,
				topP,
				maxOutputTokens,
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
			message: '',
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
				responseJSON.message = result ?? '';
		}

		returnData.push({
			json: responseJSON,
		});

		return [returnData];
	}
}
