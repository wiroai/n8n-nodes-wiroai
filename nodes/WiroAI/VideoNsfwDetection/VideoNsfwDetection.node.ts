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

export class VideoNsfwDetection implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Video Nsfw Detection',
		name: 'videoNsfwDetection',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'NSFW video detection automatically analyzes video content to identify inappropriate or explicit',
		defaults: {
			name: 'Wiro - Video Nsfw Detection',
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
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: '183168',
				description: 'Select option for model',
				options: [
					{ name: 'Nsfw Image Detection', value: '183168' },
					{ name: 'Vit Base Nsfw Detector', value: '183164' },
				],
			},
			{
				displayName: 'Input Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Input-video-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const model = this.getNodeParameter('model', 0, '') as string;
		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/video-nsfw-detection',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				model,
				inputVideoUrl,
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
