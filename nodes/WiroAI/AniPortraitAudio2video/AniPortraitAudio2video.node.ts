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

export class AniPortraitAudio2video implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ani Portrait Audio2Video',
		name: 'aniPortraitAudio2video',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'It creates a video by combining the input image with the movements of a person in a video and a',
		defaults: {
			name: 'Wiro - Ani Portrait Audio2Video',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Input Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				description: 'Input-video-help',
			},
			{
				displayName: 'Input Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Input-audio-help',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width-help',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height-help',
			},
			{
				displayName: 'Fps',
				name: 'fps',
				type: 'number',
				default: 0,
				description: 'Fps-help',
			},
			{
				displayName: 'Fi Step',
				name: 'step',
				type: 'number',
				default: 0,
				description: 'Fi-step-help',
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

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const fps = this.getNodeParameter('fps', 0, 0) as number;
		const step = this.getNodeParameter('step', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/ani-portrait-audio2video',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputVideoUrl,
				inputAudioUrl,
				steps,
				scale,
				width,
				height,
				fps,
				step,
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
