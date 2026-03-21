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

export class BarkDialogue implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Bark Dialogue',
		name: 'barkDialogue',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Text-Prompted Generative Audio Model',
		defaults: {
			name: 'Wiro - Bark Dialogue',
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
				description: 'Prompt-help',
			},
			{
				displayName: 'Speakers',
				name: 'speakers',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Speakers-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Silence',
				name: 'silence',
				type: 'number',
				default: 0,
				description: 'Silence-help',
			},
			{
				displayName: 'Text Temp',
				name: 'textTemp',
				type: 'number',
				default: 0,
				description: 'Text-temp-help',
			},
			{
				displayName: 'Waveform Temp',
				name: 'waveformTemp',
				type: 'number',
				default: 0,
				description: 'Waveform-temp-help',
			},
			{
				displayName: 'Min Eos P',
				name: 'minEosP',
				type: 'number',
				default: 0,
				description: 'Min-eos-p-help',
			},
			{
				displayName: 'Dialogue',
				name: 'dialogue',
				type: 'boolean',
				default: false,
				description: 'Whether to enable dialogue-help',
			},
			{
				displayName: 'Simple Generation',
				name: 'simpleGeneration',
				type: 'boolean',
				default: false,
				description: 'Whether to enable simple-generation-help',
			},
			{
				displayName: 'Output Full',
				name: 'outputFull',
				type: 'boolean',
				default: false,
				description: 'Whether to enable output-full-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const speakers = this.getNodeParameter('speakers', 0) as string;
		const silence = this.getNodeParameter('silence', 0, 0) as number;
		const textTemp = this.getNodeParameter('textTemp', 0, 0) as number;
		const waveformTemp = this.getNodeParameter('waveformTemp', 0, 0) as number;
		const minEosP = this.getNodeParameter('minEosP', 0, 0) as number;
		const dialogue = this.getNodeParameter('dialogue', 0, false) as boolean;
		const simpleGeneration = this.getNodeParameter('simpleGeneration', 0, false) as boolean;
		const outputFull = this.getNodeParameter('outputFull', 0, false) as boolean;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/suno-ai/bark-dialogue',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				speakers,
				silence,
				textTemp,
				waveformTemp,
				minEosP,
				dialogue,
				simpleGeneration,
				outputFull,
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
