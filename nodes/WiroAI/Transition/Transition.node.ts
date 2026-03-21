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

export class Transition implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Transition',
		name: 'transition',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'PixVerse Transition tool',
		defaults: {
			name: 'Wiro - Transition',
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
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: 'v3.5',
				required: true,
				description: 'The model parameter value',
				options: [
					{ name: 'V3.5', value: 'v3.5' },
					{ name: 'V4', value: 'v4' },
					{ name: 'V4.5', value: 'v4.5' },
					{ name: 'V5', value: 'v5' },
				],
			},
			{
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'First frame of the video',
			},
			{
				displayName: 'Image 2 URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Last frame of the video',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '5',
				required: true,
				description: 'Duration of the video',
				options: [
					{ name: '5', value: '5' },
					{ name: '8', value: '8' },
				],
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Quality of the video',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '360p(Turbo)', value: '360p' },
					{ name: '540p', value: '540p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Motion Mode',
				name: 'motionMode',
				type: 'options',
				default: 'fast',
				description: 'Fast only available when duration is 5. 1080p does not support fast. v5 only supports normal motion mode',
				options: [
					{ name: 'Fast', value: 'fast' },
					{ name: 'Normal', value: 'normal' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Leave null to randomize',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const model = this.getNodeParameter('model', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const quality = this.getNodeParameter('quality', 0) as string;
		const motionMode = this.getNodeParameter('motionMode', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/PixVerse/Transition',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				model,
				inputImageUrl,
				inputImage2Url,
				prompt,
				duration,
				quality,
				motionMode,
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
