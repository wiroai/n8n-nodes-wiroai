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

export class GenerateSpeechTTS implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Speech',
		name: 'generateSpeechTts',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Converts text to speech using Wiro AI',
		defaults: {
			name: 'Wiro - Generate Speech',
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
				description: 'The text prompt to convert into speech audio',
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				options: [
					{ name: 'Alloy', value: 'af_alloy' },
					{ name: 'Heart', value: 'af_heart' },
					{ name: 'Jessica', value: 'af_jessica' },
					{ name: 'Nova', value: 'af_nova' },
					{ name: 'Santa', value: 'am_santa' },
				],
				default: 'af_heart',
				required: true,
				description: 'Choose a voice character for the generated speech',
			},
			{
				displayName: 'Language',
				name: 'langCode',
				type: 'options',
				options: [
					{ name: 'American English', value: 'a' },
					{ name: 'Brazilian Portuguese', value: 'p' },
					{ name: 'British English', value: 'b' },
					{ name: 'French', value: 'f' },
					{ name: 'Hindi', value: 'h' },
					{ name: 'Italian', value: 'i' },
					{ name: 'Spanish', value: 'e' },
				],
				default: 'a',
				required: true,
				description: 'Select the language variant for the spoken output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const voice = this.getNodeParameter('voice', 0) as string;
		const langCode = this.getNodeParameter('langCode', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/kokoro_tts',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				voice,
				langCode,
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
