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

export class S2Pro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Fish Audio S2 Pro TTS Model',
		name: 's2Pro',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Fish Audio S2 Pro delivers fast, natural-sounding text-to-speech with voice cloning. Ideal for',
		defaults: {
			name: 'Wiro - Fish Audio S2 Pro TTS Model',
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
				required: true,
				description: 'Text to synthesize into speech; use &lt;|speaker:N|&gt; tags for multi-speaker and emotion tags like (excited) or [laugh] for prosody control',
			},
			{
				displayName: 'Reference Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Reference audio file (10-30 seconds recommended) for voice cloning; requires reference_text to be set',
			},
			{
				displayName: 'Reference Text',
				name: 'referenceText',
				type: 'string',
				default: '',
				description: 'Exact transcription of the reference audio file; must match the spoken content for accurate voice cloning',
			},
			{
				displayName: 'Max New Tokens',
				name: 'maxNewTokens',
				type: 'number',
				default: 0,
				description: 'Maximum number of tokens to generate; set to 0 for automatic length based on input text',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				description: 'Controls randomness in generation; lower values (0.5) produce more consistent output, higher values (1.2+) increase expressiveness and variation',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 0,
				description: 'Nucleus sampling threshold; only tokens with cumulative probability up to this value are considered during generation',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 0,
				description: 'Limits token selection to the top K most probable tokens at each generation step',
			},
			{
				displayName: 'Chunk Length',
				name: 'chunkLength',
				type: 'number',
				default: 0,
				description: 'Maximum UTF-8 byte length per generation chunk; smaller values may improve quality for long texts but increase processing time',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed for reproducibility; using the same seed with identical parameters produces the same audio output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const referenceText = this.getNodeParameter('referenceText', 0, '') as string;
		const maxNewTokens = this.getNodeParameter('maxNewTokens', 0, 0) as number;
		const temperature = this.getNodeParameter('temperature', 0, 0) as number;
		const topP = this.getNodeParameter('topP', 0, 0) as number;
		const topK = this.getNodeParameter('topK', 0, 0) as number;
		const chunkLength = this.getNodeParameter('chunkLength', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/fishaudio/s2-pro',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				inputAudioUrl,
				referenceText,
				maxNewTokens,
				temperature,
				topP,
				topK,
				chunkLength,
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
