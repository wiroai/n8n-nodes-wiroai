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

export class ImageToVideoHailuo01 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image To Video Hailuo 01',
		name: 'imageToVideoHailuo01',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate 6s videos with an image. (Also known as Hailuo) MiniMax/image-to-video-01 is the base',
		defaults: {
			name: 'Wiro - Image To Video Hailuo 01',
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
				description: 'First frame image for video generation. The output video will have the same aspect ratio as this image. Aspect ratio should be greater than 2:5 and less than 5:2. the shorter side must exceed 300 pixels',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/MiniMax/image-to-video-hailuo-01',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
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
