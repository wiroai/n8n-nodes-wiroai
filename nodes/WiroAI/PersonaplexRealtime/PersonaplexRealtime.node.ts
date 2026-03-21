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

export class PersonaplexRealtime implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - PersonaPlex - Speech-to-Speech Conversion',
		name: 'personaplexRealtime',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'PersonaPlex AI enables speech-to-speech conversion with customizable voices. Perfect for conten',
		defaults: {
			name: 'Wiro - PersonaPlex - Speech-to-Speech Conversion',
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
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				default: 'NATF0',
				required: true,
				description: 'Natural voices: conversational style, Variety voices: more expressive style',
				options: [
					{ name: 'NATF0 Natural Female 0', value: 'NATF0' },
					{ name: 'NATF1 Natural Female 1', value: 'NATF1' },
					{ name: 'NATF2 Natural Female 2', value: 'NATF2' },
					{ name: 'NATF3 Natural Female 3', value: 'NATF3' },
					{ name: 'NATM0 Natural Male 0', value: 'NATM0' },
					{ name: 'NATM1 Natural Male 1', value: 'NATM1' },
					{ name: 'NATM2 Natural Male 2', value: 'NATM2' },
					{ name: 'NATM3 Natural Male 3', value: 'NATM3' },
					{ name: 'VARF0 Variety Female 0', value: 'VARF0' },
					{ name: 'VARF1 Variety Female 1', value: 'VARF1' },
					{ name: 'VARF2 Variety Female 2', value: 'VARF2' },
					{ name: 'VARF3 Variety Female 3', value: 'VARF3' },
					{ name: 'VARF4 Variety Female 4', value: 'VARF4' },
					{ name: 'VARM0 Variety Male 0', value: 'VARM0' },
					{ name: 'VARM1 Variety Male 1', value: 'VARM1' },
					{ name: 'VARM2 Variety Male 2', value: 'VARM2' },
					{ name: 'VARM3 Variety Male 3', value: 'VARM3' },
					{ name: 'VARM4 Variety Male 4', value: 'VARM4' },
				],
			},
			{
				displayName: 'Text Temperature',
				name: 'tempText',
				type: 'number',
				default: 0,
				description: 'Controls the randomness of generated text responses',
			},
			{
				displayName: 'Audio Top K',
				name: 'topkAudio',
				type: 'number',
				default: 0,
				description: 'Limits audio generation to the top K most likely tokens',
			},
			{
				displayName: 'Text Top K',
				name: 'topkText',
				type: 'number',
				default: 0,
				description: 'Limits text generation to the top K most likely tokens',
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
		const voice = this.getNodeParameter('voice', 0) as string;
		const tempText = this.getNodeParameter('tempText', 0, 0) as number;
		const topkAudio = this.getNodeParameter('topkAudio', 0, 0) as number;
		const topkText = this.getNodeParameter('topkText', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/nvidia/PersonaPlex-Realtime',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				voice,
				tempText,
				topkAudio,
				topkText,
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
