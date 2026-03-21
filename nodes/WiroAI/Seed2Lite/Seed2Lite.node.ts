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

export class Seed2Lite implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Seed-V2-Lite Text-to-Image Generator',
		name: 'seed2Lite',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate visual content with Seed-V2-Lite, a lightweight LLM from ByteDance. Perfect for creati',
		defaults: {
			name: 'Wiro - Seed-V2-Lite Text-to-Image Generator',
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
				description: 'Optional. Multiple image files separated by semicolon for visual understanding.',
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
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				description: 'Optional. Controls randomness. Range [0, 2]. Default 1',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 0,
				description: 'Optional. Nucleus sampling threshold. Range [0, 1]. Default 0.7',
			},
			{
				displayName: 'Frequency Penalty',
				name: 'frequencyPenalty',
				type: 'number',
				default: 0,
				description: 'Optional. Penalizes repeated tokens by frequency. Range [-2, 2]. Default 0',
			},
			{
				displayName: 'Presence Penalty',
				name: 'presencePenalty',
				type: 'number',
				default: 0,
				description: 'Optional. Encourages new topics. Range [-2, 2]. Default 0',
			},
			{
				displayName: 'Max Completion Tokens',
				name: 'maxCompletionTokens',
				type: 'number',
				default: 0,
				description: 'Optional. Max output tokens including chain-of-thought. Range [0, 65536]. Default 65536',
			},
			{
				displayName: 'Reasoning Effort',
				name: 'reasoningEffort',
				type: 'options',
				default: 'high',
				description: 'Optional. Controls reasoning depth. Default medium',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Minimal', value: 'minimal' },
				],
			},
			{
				displayName: 'Thinking Type',
				name: 'thinkingType',
				type: 'options',
				default: 'auto',
				description: 'Optional. Enable/disable deep thinking mode. Default enabled',
				options: [
					{ name: 'Auto', value: 'auto' },
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Enabled', value: 'enabled' },
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
		const temperature = this.getNodeParameter('temperature', 0, 0) as number;
		const topP = this.getNodeParameter('topP', 0, 0) as number;
		const frequencyPenalty = this.getNodeParameter('frequencyPenalty', 0, 0) as number;
		const presencePenalty = this.getNodeParameter('presencePenalty', 0, 0) as number;
		const maxCompletionTokens = this.getNodeParameter('maxCompletionTokens', 0, 0) as number;
		const reasoningEffort = this.getNodeParameter('reasoningEffort', 0, '') as string;
		const thinkingType = this.getNodeParameter('thinkingType', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/bytedance/seed-v2-lite',
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
				temperature,
				topP,
				frequencyPenalty,
				presencePenalty,
				maxCompletionTokens,
				reasoningEffort,
				thinkingType,
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
