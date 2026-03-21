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

export class Videollama32b implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Videollama3 2B',
		name: 'videollama32b',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'VideoLLaMA3-2B is a model designed for video understanding',
		defaults: {
			name: 'Wiro - Videollama3 2B',
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
				displayName: 'Input Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Input-video-help',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Prompt-help',
			},
			{
				displayName: 'Max New Tokens',
				name: 'maxNewOutputLength',
				type: 'number',
				default: 0,
				description: 'Maximum number of tokens to generate. A word is generally 2-3 tokens.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const maxNewOutputLength = this.getNodeParameter('maxNewOutputLength', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/DAMO-NLP-SG/VideoLLaMA3-2B',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				prompt,
				max_new_tokens: maxNewOutputLength,
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
