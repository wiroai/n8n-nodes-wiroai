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

export class ChatterboxTurbo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Chatterbox Turbo',
		name: 'chatterboxTurbo',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'The fastest open source TTS model without sacrificing quality.',
		defaults: {
			name: 'Wiro - Chatterbox Turbo',
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
				displayName: 'Input Audio (Optional) URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Supported audio formats: .wav, .m4a, .mp3, .ogg, .opus and webm',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Prompt-help',
			},
			{
				displayName: 'Exaggeration',
				name: 'exaggeration',
				type: 'number',
				default: 0,
				required: true,
				description: 'Controls speech expressiveness (0.25-2.0, neutral=0.5, extreme values may be unstable)',
			},
			{
				displayName: 'Cfg Weight',
				name: 'cfg_weight',
				type: 'number',
				default: 0,
				required: true,
				description: 'CFG/Pace weight controlling generation guidance (0.2-1.0). Use 0.5 for balanced results, 0 for language transfer.',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				required: true,
				description: 'Controls randomness in generation (0.05-5.0, higher=more varied)',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 0,
				required: true,
				description: 'Ensures that when selecting the next token in the model, it only chooses from among the most probable tokens that reach the cumulative probability p value',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 0,
				required: true,
				description: 'Top-k sampling. Limits vocabulary to top k tokens at each step.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const exaggeration = this.getNodeParameter('exaggeration', 0) as number;
		const cfg_weight = this.getNodeParameter('cfg_weight', 0) as number;
		const temperature = this.getNodeParameter('temperature', 0) as number;
		const topP = this.getNodeParameter('topP', 0) as number;
		const topK = this.getNodeParameter('topK', 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ resemble-ai/chatterbox-turbo',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputAudioUrl,
				prompt,
				exaggeration,
				cfg_weight,
				temperature,
				topP,
				topK,
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
