import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from './utils/auth';
import { pollTaskUntilComplete } from './utils/polling';

export class GenerateSpeechTTS implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Speech',
		name: 'wiroaiGenerateSpeechTTS',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Converts text to speech using Wiro AI',
		defaults: {
			name: 'Generate Speech',
		},
		inputs: ['main'],
		outputs: ['main'],
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
					{ name: 'Santa', value: 'am_santa' },
					{ name: 'Nova', value: 'af_nova' },
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
					{ name: 'British English', value: 'b' },
					{ name: 'Spanish', value: 'e' },
					{ name: 'French', value: 'f' },
					{ name: 'Hindi', value: 'h' },
					{ name: 'Italian', value: 'i' },
					{ name: 'Brazilian Portuguese', value: 'p' },
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
				throw new Error('❌ Wiro API did not return task ID or access token.');
			}

			// 2. Task tamamlanana kadar bekle
			const result = await pollTaskUntilComplete.call(this, socketaccesstoken, headers);

			returnData.push({
				json: {
					taskid: response.taskid,
					url: result ?? null,
					status: result ? 'completed' : 'failed',
				},
			});
		}

		return [returnData];
	}
}
