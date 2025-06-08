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

export class VideoBgMusicGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Video Background Music Generator',
		name: 'videoBgMusicGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Adds AI-generated background music to videos',
		defaults: {
			name: 'Wiro - Video Background Music Generator',
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
				displayName: 'Enter Your Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Upload a video file or paste a URL to apply background music',
			},
			{
				displayName: 'Tokens',
				name: 'tokens',
				// 'tokens' is a numeric config string, not a password.
				// eslint-disable-next-line n8n-nodes-base/node-param-type-options-password-missing
				type: 'string',
				default: '1024',
				description: 'Number of tokens to control generation length',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '3',
				description: 'Classifier-free guidance scale',
			},
			{
				displayName: 'Background Music Volume',
				name: 'bgMusicVolume',
				type: 'string',
				default: '0.7',
				description: 'Set the volume for the generated music (0.0 to 1.0)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;
		const tokens = this.getNodeParameter('tokens', 0, '') as string;
		const scale = this.getNodeParameter('scale', 0, '') as string;
		const bgMusicVolume = this.getNodeParameter('bgMusicVolume', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;

		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/video-background-music-gen',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				tokens,
				scale,
				bgMusicVolume,
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
