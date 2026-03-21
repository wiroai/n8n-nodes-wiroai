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

export class NanoBanana implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Nano Banana API: Create Mobile & Web Apps with Nano Banana',
		name: 'nanoBanana',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Google\'s Gemini 2.5 Flash Image Preview, also known as Nano Banana, model for text-to-image and',
		defaults: {
			name: 'Wiro - Nano Banana API: Create Mobile & Web Apps with Nano Banana',
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
				description: 'Optional list of input image URL(s) and/or file(s) for creating, editing or combining images',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'The prompt to generate the image',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				description: 'The temperature parameter value',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Aspect Ratio of the output image',
				options: [
					{ name: '1:1 1024x1024', value: '1:1' },
					{ name: '16:9 1408x768', value: '16:9' },
					{ name: '2:3 960x1408', value: '2:3' },
					{ name: '21:9 1792x768', value: '21:9' },
					{ name: '3:2 1408x960', value: '3:2' },
					{ name: '3:4 896x1280', value: '3:4' },
					{ name: '4:3 1280x896', value: '4:3' },
					{ name: '4:5 896x1120', value: '4:5' },
					{ name: '5:4 1120x896', value: '5:4' },
					{ name: '9:16 768x1408', value: '9:16' },
					{ name: 'Match Input Image', value: 'match_input_image' },
				],
			},
			{
				displayName: 'Safety Setting',
				name: 'safetySetting',
				type: 'options',
				default: 'BLOCK_LOW_AND_ABOVE',
				description: 'The safetySetting parameter value',
				options: [
					{ name: 'BLOCK LOW AND ABOVE', value: 'BLOCK_LOW_AND_ABOVE' },
					{ name: 'BLOCK MEDIUM AND ABOVE', value: 'BLOCK_MEDIUM_AND_ABOVE' },
					{ name: 'BLOCK NONE', value: 'BLOCK_NONE' },
					{ name: 'BLOCK ONLY HIGH', value: 'BLOCK_ONLY_HIGH' },
					{ name: 'OFF', value: 'OFF' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const temperature = this.getNodeParameter('temperature', 0, 0) as number;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const safetySetting = this.getNodeParameter('safetySetting', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/nano-banana',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				temperature,
				aspectRatio,
				safetySetting,
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
