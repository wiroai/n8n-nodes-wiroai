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

export class TextToVideoWan21 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Video From Text',
		name: 'textToVideoWan21',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate Video From Text',
		defaults: {
			name: 'Wiro - Generate Video From Text',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default:
					'A serene forest with sunlight streaming through the trees and leaves gently falling',
				required: true,
				description:
					'Just type a description, and our AI will create a video that brings your idea to life',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: 'bad quality, blurry',
				required: true,
				description: "Give negative things you don't want in your output",
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '832*480',
				required: true,
				description: 'Give the size of your output',
				options: [
					{ name: '832×480', value: '832*480' },
					{ name: '720×1280', value: '720*1280' },
					{ name: '1280×720', value: '1280*720' },
					{ name: '480×832', value: '480*832' },
				],
			},
			{
				displayName: 'Number of Frames',
				name: 'numFrames',
				type: 'string',
				default: '81',
				required: true,
				description: 'Give the frames that you want',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '5.0',
				required: true,
				description: 'Give the scale for the output',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'string',
				default: '25',
				required: true,
				description: 'Give the steps for your output',
			},
			{
				displayName: 'Frames per Second',
				name: 'fps',
				type: 'string',
				default: '16',
				required: true,
				description: 'Give the frames per second',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '5654957',
				required: true,
				description: 'Give a random seed',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0) as string;
		const size = this.getNodeParameter('size', 0) as string;
		const scale = this.getNodeParameter('scale', 0) as string;
		const steps = this.getNodeParameter('steps', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const fps = this.getNodeParameter('fps', 0) as string;
		const numFrames = this.getNodeParameter('numFrames', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/text-to-video-wan2++1',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel: '871',
				selectedModelPrivate: '',
				prompt,
				negativePrompt,
				size,
				scale,
				steps,
				seed,
				fps,
				numFrames,
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
