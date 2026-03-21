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

export class HunyuanVideo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Hunyuan Text to Video',
		name: 'hunyuanVideo',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'HunyuanVideo is an advanced video generation tool capable of producing high-quality, precise, a',
		defaults: {
			name: 'Wiro - Hunyuan Text to Video',
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
				default: '',
				required: true,
				description: 'Prompt-help',
			},
			{
				displayName: 'Negativeprompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Negativeprompt-help',
			},
			{
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Embedded Guidance Scale',
				name: 'embeddedScale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Video Length',
				name: 'videoLength',
				type: 'number',
				default: 0,
				description: 'If N is divisible by 4, the video length should be N+1',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				default: '720x720',
				required: true,
				description: 'Select option for size',
				options: [
					{ name: 'Ratio: 1:1 | 720 X 720', value: '720x720' },
					{ name: 'Ratio: 16:9 | 960x544', value: '960x544' },
					{ name: 'Ratio: 3:4 | 624 X 832', value: '624x832' },
					{ name: 'Ratio: 4:3 | 832 X 624', value: '832x624' },
					{ name: 'Ratio: 9:16 | 544 X 960', value: '544x960' },
				],
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
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

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const embeddedScale = this.getNodeParameter('embeddedScale', 0, 0) as number;
		const videoLength = this.getNodeParameter('videoLength', 0, 0) as number;
		const size = this.getNodeParameter('size', 0) as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/hunyuan_video',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				negativePrompt,
				scale,
				embeddedScale,
				videoLength,
				size,
				steps,
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
