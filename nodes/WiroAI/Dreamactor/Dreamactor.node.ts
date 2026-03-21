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

export class Dreamactor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - DreamActor - Image-to-Video Generation',
		name: 'dreamactor',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate videos from images with DreamActor AI by ByteDance. Perfect for creating animated cont',
		defaults: {
			name: 'Wiro - DreamActor - Image-to-Video Generation',
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
				required: true,
				description: 'Format: jpeg, jpg or png. Size: maximum 4.7 MB. Resolution: between 480✖️480 and 1920✖️1080 (anything larger will be proportionally reduced) Image supports driving for real people, animation, pets, etc.; overly abstract subjects may fail to generate',
			},
			{
				displayName: 'Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Format: mp4 or webm. Duration: maximum 30 seconds. Resolution: between 200✖️200 and 2048✖️1440(2K) supports both facial expressions and body movement driving, and can handle full-body, half-body, or portrait driving: source: Video (supports real people, animation, pets) range: Full face + body',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/DreamActor',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputVideoUrl,
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
