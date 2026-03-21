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

export class TextToVideoSeedanceLite1 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Video Seedance Lite V1',
		name: 'textToVideoSeedanceLite1',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'A video generation model that offers 5s or 10s videos, at 480p, 720p and 1080p resolution',
		defaults: {
			name: 'Wiro - Text To Video Seedance Lite V1',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Video resolution',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'The aspect ratio of the output video, which can be set under the resolution of 480p or 720p',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
					{ name: '9:21', value: '9:21' },
					{ name: 'Adaptive', value: 'adaptive' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				required: true,
				description: 'Generated video duration in seconds',
				options: [
					{ name: '10', value: '10' },
					{ name: '5', value: '5' },
				],
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				description: 'Generate whether the video contains a watermark',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Seed integer to control the randomness of generated content. Set -1 to random.',
			},
			{
				displayName: 'Fix Camera',
				name: 'camerafixed',
				type: 'options',
				default: 'false',
				description: 'Whether to fix the camera position',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const watermark = this.getNodeParameter('watermark', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const camerafixed = this.getNodeParameter('camerafixed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/text-to-video-seedance-lite-v1',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				resolution,
				ratio,
				duration,
				watermark,
				seed,
				camerafixed,
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
