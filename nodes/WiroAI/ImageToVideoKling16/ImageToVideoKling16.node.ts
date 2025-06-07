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

export class ImageToVideoKling16 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image to Video (KlingAI 1.6)',
		name: 'imageToVideoKling16',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates video with image using KlingAI 1.6',
		defaults: {
			name: 'Wiro - Image to Video (KlingAI 1.6)',
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
				displayName: 'Input Image (First Frame) URL',
				name: 'inputImageFirstUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Public image URL to be used as the first frame of the animation',
			},
			{
				displayName: 'Input Image (Last Frame) URL',
				name: 'inputImageLastUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Public image URL to be used as the last frame of the animation',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: 'a portrait photo of a woman underwater with flowing hair',
				required: true,
				description: 'Describe the overall animation or motion desired',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: 'blurry, distorted, bad anatomy',
				description: 'Describe what you do NOT want to appear in the video',
			},
			{
				displayName: 'Video Duration (Seconds)',
				name: 'videoSeconds',
				type: 'string',
				default: '5',
				required: true,
				description: 'Duration of the video to be generated',
			},
			{
				displayName: 'Video Mode',
				name: 'videoMode',
				type: 'string',
				default: 'std',
				description: 'Video generation mode',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '0.5',
				description: 'Classifier-free guidance scale',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageFirstUrl = this.getNodeParameter('inputImageFirstUrl', 0) as string;
		const inputImageLastUrl = this.getNodeParameter('inputImageLastUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '');
		const videoSeconds = this.getNodeParameter('videoSeconds', 0) as string;
		const videoMode = this.getNodeParameter('videoMode', 0, '');
		const scale = this.getNodeParameter('scale', 0, '');

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/image-to-video-klingai-v1++6',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageFirstUrl,
				inputImageLastUrl,
				prompt,
				negativePrompt,
				videoSeconds,
				videoMode,
				scale,
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
