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

export class Gpt5Mini implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - GPT-5 Mini AI Model',
		name: 'gpt5Mini',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Access GPT-5 Mini API by OpenAI on Wiro. Simple integration, transparent pricing, and comprehen',
		defaults: {
			name: 'Wiro - GPT-5 Mini AI Model',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional. Multiple image files separated by semicolon. GPT-5.2 only supports images',
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
				displayName: 'Reasoning Effort',
				name: 'reasoning',
				type: 'options',
				default: 'high',
				description: 'Optional. Controls reasoning effort level. If web search is enabled and reasoning set to default it will be fallback the low, web search can not be used with minimal reasoning',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Minimal', value: 'minimal' },
				],
			},
			{
				displayName: 'Web Search',
				name: 'webSearch',
				type: 'options',
				default: 'false',
				description: 'Optional. Enable web search. The number of web searches is determined by the complexity of your prompt. $0.01 per search',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Verbosity',
				name: 'verbosity',
				type: 'options',
				default: 'high',
				description: 'Optional. Controls response verbosity level.',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const user_id = this.getNodeParameter('user_id', 0, '') as string;
		const session_id = this.getNodeParameter('session_id', 0, '') as string;
		const systemInstructions = this.getNodeParameter('systemInstructions', 0, '') as string;
		const reasoning = this.getNodeParameter('reasoning', 0, '') as string;
		const webSearch = this.getNodeParameter('webSearch', 0, '') as string;
		const verbosity = this.getNodeParameter('verbosity', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/openai/gpt-5-mini',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				user_id,
				session_id,
				systemInstructions,
				reasoning,
				webSearch,
				verbosity,
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
