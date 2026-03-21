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

export class Wiro3dTextAnimations implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - 3D Text Animations',
		name: 'wiro3dTextAnimations',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'AI-powered 3D Text Animations API transforms text into captivating animated videos. Features 22',
		defaults: {
			name: 'Wiro - 3D Text Animations',
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
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				description: 'Short promotional text (1-2 words recommended, e.g., SALE, New Arrival)',
			},
			{
				displayName: 'Video Mode',
				name: 'videoMode',
				type: 'options',
				default: 'pro',
				required: true,
				description: 'Required',
				options: [
					{ name: 'Pro', value: 'pro' },
					{ name: 'Standard', value: 'std' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				description: 'Required. Default 9:16.',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Effect Type',
				name: 'effectType',
				type: 'string',
				default: '',
				required: true,
				description: 'Required',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const caption = this.getNodeParameter('caption', 0, '') as string;
		const videoMode = this.getNodeParameter('videoMode', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const effectType = this.getNodeParameter('effectType', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/3D Text Animations',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				caption,
				videoMode,
				ratio,
				effectType,
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
