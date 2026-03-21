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

export class VideoBackgroundMusicGen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Video Background Music Gen',
		name: 'videoBackgroundMusicGen',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'It’s a tool that gets your video, creates original music to match its vibe, and seamlessly adds',
		defaults: {
			name: 'Wiro - Video Background Music Gen',
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
				description: 'Input-video-help',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Text input for prompt',
			},
			{
				displayName: 'Tokens',
				name: 'generationLength',
				type: 'number',
				default: 0,
				description: 'Max number of tokens to generate',
			},
			{
				displayName: 'Guidance Scale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Bg Music Volume',
				name: 'bgMusicVolume',
				type: 'number',
				default: 0,
				description: 'Controls the relative volume of the generated background music',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const generationLength = this.getNodeParameter('generationLength', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const bgMusicVolume = this.getNodeParameter('bgMusicVolume', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/video-background-music-gen',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputVideoUrl,
				prompt,
				tokens: generationLength,
				scale,
				bgMusicVolume,
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
