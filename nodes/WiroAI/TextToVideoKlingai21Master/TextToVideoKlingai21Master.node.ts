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

export class TextToVideoKlingai21Master implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Video Klingai V2 1 Master',
		name: 'textToVideoKlingai21Master',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'KlingAI v2.1 text to video generation tool. Generate 5s and 10s videos in 720p resolution at 30',
		defaults: {
			name: 'Wiro - Text To Video Klingai V2 1 Master',
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
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Specify what to exclude from the output',
			},
			{
				displayName: 'Video Seconds',
				name: 'videoSeconds',
				type: 'options',
				default: '10',
				required: true,
				description: 'Total duration of the generated video (in seconds)',
				options: [
					{ name: '10s', value: '10' },
					{ name: '5s', value: '5' },
				],
			},
			{
				displayName: 'CFG Scale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Flexibility in video generation; The higher the value, the lower the model\'s degree of flexibility, and the stronger the relevance to the user\'s prompt',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const videoSeconds = this.getNodeParameter('videoSeconds', 0) as string;
		const scale = this.getNodeParameter('scale', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/text-to-video-klingai-v2.1-master',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				negativePrompt,
				videoSeconds,
				scale,
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
