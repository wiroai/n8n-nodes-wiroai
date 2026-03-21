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

export class VideoBackgroundMusic2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Video Background Music V2',
		name: 'videoBackgroundMusic2',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'It turns any video into a cinematic experience by generating AI-powered instrumental soundtrack',
		defaults: {
			name: 'Wiro - Video Background Music V2',
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
				description: 'Provide a video file or a video URL',
			},
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				description: 'Free-text description of the desired music. If no caption is provided, the video is automatically analyzed to create a fitting music description.',
			},
			{
				displayName: 'Reference Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Upload a song to use as style inspiration',
			},
			{
				displayName: 'Bpm',
				name: 'bpm',
				type: 'number',
				default: 0,
				description: 'Set the tempo (e.g. 80 for slow ballad, 128 for dance). Leave 0 to let AI decide. Default: 0',
			},
			{
				displayName: 'Background Music Volume',
				name: 'bgMusicVolume',
				type: 'number',
				default: 0,
				description: 'Controls the relative volume of the generated background music',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0, '') as string;
		const caption = this.getNodeParameter('caption', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const bpm = this.getNodeParameter('bpm', 0, 0) as number;
		const bgMusicVolume = this.getNodeParameter('bgMusicVolume', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/video-background-music-v2',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				caption,
				inputAudioUrl,
				bpm,
				bgMusicVolume,
				seed,
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
