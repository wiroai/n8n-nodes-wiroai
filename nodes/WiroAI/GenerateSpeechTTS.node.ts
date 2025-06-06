import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeApiError,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from './utils/auth';
import { pollTaskUntilComplete } from './utils/polling';

export class GenerateSpeechTTS implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Speech',
		name: 'wiroaiGenerateSpeechTts',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Converts text to speech using Wiro AI',
		defaults: {
			name: 'Generate Speech',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
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
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;

		for (let i = 0; i < items.length; i++) {
			const prompt = this.getNodeParameter('prompt', i) as string;
			const voice = this.getNodeParameter('voice', i) as string;
			const langCode = this.getNodeParameter('langCode', i) as string;

			const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			// 1. TTS Görevi oluştur
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

			const socketaccesstoken = response.socketaccesstoken;
			if (!response.taskid || !socketaccesstoken) {
				throw new NodeApiError(this.getNode(), {
					message: 'Wiro API did not return task ID or access token.',
				});
			}

			// 2. Task tamamlanana kadar bekle
			const result = await pollTaskUntilComplete.call(this, socketaccesstoken, headers);

			let responseJSON = {
				taskid: response.taskid,
				url: '',
				status: '',
			};

			switch (result) {
				case '-1': //Max polling attempts reached
				case '-2': //Polling Error
				case '-3': //Task finished but no usable output.
				case '-4': //Task Canceled
					responseJSON.status = 'failed';
				default:
					responseJSON.status = 'completed';
					responseJSON.url = result ?? '';
			}

			returnData.push({
				json: responseJSON,
			});
		}

		return [returnData];
	}
}
