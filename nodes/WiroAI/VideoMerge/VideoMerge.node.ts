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

export class VideoMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Video Merge',
		name: 'videoMerge',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Merge multiple videos into one seamlessly using either file uploads or video URLs. This tool co',
		defaults: {
			name: 'Wiro - Video Merge',
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
				displayName: 'Input Video Multiple URLs',
				name: 'inputVideoMultipleUrl',
				type: 'string',
				default: '',
				description: 'Upload multiple video files. Ensure the files are relevant and properly formatted for accurate processing. Supported file types: .mp4',
			},
			{
				displayName: 'Input Video Url Multiple',
				name: 'inputVideoUrlMultiple',
				type: 'string',
				default: '',
				description: 'Enter multiple video file URLs separated by comma ( , ). Ensure the URLs are accessible and correctly formatted. Supported file types: .mp4',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoMultipleUrl = this.getNodeParameter('inputVideoMultipleUrl', 0, '') as string;
		const inputVideoUrlMultiple = this.getNodeParameter('inputVideoUrlMultiple', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/video-merge',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoMultiple: inputVideoMultipleUrl,
				inputVideoUrlMultiple,
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
