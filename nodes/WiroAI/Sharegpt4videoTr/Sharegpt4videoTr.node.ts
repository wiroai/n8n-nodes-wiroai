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

export class Sharegpt4videoTr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Sharegpt4Video Tr',
		name: 'sharegpt4videoTr',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Video to text ai tool with Turkish support',
		defaults: {
			name: 'Wiro - Sharegpt4Video Tr',
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
				displayName: 'Input Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Input-video-help',
			},
			{
				displayName: 'Conv Mode',
				name: 'convMode',
				type: 'options',
				default: 'llava_llama_3',
				description: 'Input-video-URL-help',
				options: [
					{ name: 'Llava Llama 3', value: 'llava_llama_3' },
					{ name: 'Llava V0', value: 'llava_v0' },
					{ name: 'Llava V1', value: 'llava_v1' },
					{ name: 'Mistral Direct', value: 'mistral_direct' },
					{ name: 'Mpt', value: 'mpt' },
					{ name: 'Plain', value: 'plain' },
					{ name: 'V0', value: 'v0' },
					{ name: 'V0 Mmtag', value: 'v0_mmtag' },
					{ name: 'V0 Plain', value: 'v0_plain' },
					{ name: 'V1 Mmtag', value: 'v1_mmtag' },
					{ name: 'Vicuna V1', value: 'vicuna_v1' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;
		const convMode = this.getNodeParameter('convMode', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/ShareGPT4Video-TR',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				convMode,
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
