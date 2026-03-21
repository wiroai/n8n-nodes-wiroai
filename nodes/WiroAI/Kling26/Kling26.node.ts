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

export class Kling26 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kling V2 6',
		name: 'kling26',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Kling v2.6 is a unified multimodal model designed to solve the "silent video" problem of previo',
		defaults: {
			name: 'Wiro - Kling V2 6',
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
				displayName: 'First Frame URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional',
			},
			{
				displayName: 'Last Frame URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. Sound will be off.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Specify what to exclude from the output',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				required: true,
				description: 'Total duration of the generated video (in seconds)',
				options: [
					{ name: '10', value: '10' },
					{ name: '5', value: '5' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'The ratio parameter value',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Sound',
				name: 'sound',
				type: 'options',
				default: 'off',
				required: true,
				description: 'Optional. Default off. If there is last image then sound will be off',
				options: [
					{ name: 'Off', value: 'off' },
					{ name: 'On', value: 'on' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const sound = this.getNodeParameter('sound', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/kling-v2.6',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				prompt,
				negativePrompt,
				duration,
				ratio,
				sound,
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
