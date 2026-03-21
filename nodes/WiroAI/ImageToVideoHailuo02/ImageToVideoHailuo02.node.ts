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

export class ImageToVideoHailuo02 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image To Video Hailuo 02',
		name: 'imageToVideoHailuo02',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'MiniMax',
		defaults: {
			name: 'Wiro - Image To Video Hailuo 02',
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
				displayName: 'Image First URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'First frame image for video generation. The output video will have the same aspect ratio as this image.',
			},
			{
				displayName: 'Image Last URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional. Last frame image for video generation.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Prompt Optimizer',
				name: 'promptOptimizer',
				type: 'options',
				default: 'false',
				description: 'The model will automatically optimize the incoming prompt to improve the generation quality If necessary. For more precise control, this parameter can be set to False, and the model will follow the instructions more strictly. At this time It is recommended to provide finer prompts for best results',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080P',
				description: '1080P resolution can only produce 6s videos',
				options: [
					{ name: '1080P', value: '1080P' },
					{ name: '768P', value: '768P' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				required: true,
				description: 'If resolution set to 1080p duration is 6 seconds by default. 10 seconds videos only available for 768P.',
				options: [
					{ name: '10', value: '10' },
					{ name: '6', value: '6' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const promptOptimizer = this.getNodeParameter('promptOptimizer', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0, '') as string;
		const duration = this.getNodeParameter('duration', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/MiniMax/image-to-video-hailuo-02',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				prompt,
				promptOptimizer,
				resolution,
				duration,
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
