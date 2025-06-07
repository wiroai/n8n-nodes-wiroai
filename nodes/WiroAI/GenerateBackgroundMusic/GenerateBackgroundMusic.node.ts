import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionType,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class GenerateBackgroundMusic implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Background Music',
		name: 'generateBackgroundMusic',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates background music using AI',
		defaults: {
			name: 'Wiro - Generate Background Music',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default:
					'Sad and longing. The melody is slow and wistful creating a sense of melancholy and nostalgia. Simple arrangement on the piano.',
				required: true,
				description: 'Enter a style, genre, or mood to guide the music generation',
			},
			{
				displayName: 'Tokens',
				name: 'tokens',
				type: 'string',
				default: '1024',
				required: true,
				description: 'Max number of tokens to generate',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '3',
				required: true,
				description: 'Scale for classifier-free guidance',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const tokens = this.getNodeParameter('tokens', 0) as string;
		const scale = this.getNodeParameter('scale', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;

		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/music_gen',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				tokens,
				scale,
			},
			json: true,
		});

		if (!response?.id || !response?.socketaccesstoken) {
			throw new NodeApiError(this.getNode(), {
				message:
					'Wiro API did not return a valid task ID or socket access token ' +
					JSON.stringify(response),
			});
		}

		const taskid = response.id;
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
