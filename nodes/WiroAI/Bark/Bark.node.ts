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

export class Bark implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Speech Generation',
		name: 'bark',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Text-Prompted Generative Audio Model',
		defaults: {
			name: 'Wiro - Speech Generation',
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
				type: 'options',
				default: 'v2/de_speaker_0',
				required: true,
				description: 'Speakers-help',
				options: [
					{ name: '[DE] Speaker 0 Male', value: 'v2/de_speaker_0' },
					{ name: '[DE] Speaker 1 Male', value: 'v2/de_speaker_1' },
					{ name: '[DE] Speaker 2 Male', value: 'v2/de_speaker_2' },
					{ name: '[DE] Speaker 3 Female', value: 'v2/de_speaker_3' },
					{ name: '[DE] Speaker 4 Male', value: 'v2/de_speaker_4' },
					{ name: '[DE] Speaker 5 Male', value: 'v2/de_speaker_5' },
					{ name: '[DE] Speaker 6 Male', value: 'v2/de_speaker_6' },
					{ name: '[DE] Speaker 7 Male', value: 'v2/de_speaker_7' },
					{ name: '[DE] Speaker 8 Female', value: 'v2/de_speaker_8' },
					{ name: '[DE] Speaker 9 Male', value: 'v2/de_speaker_9' },
					{ name: '[EN] Speaker 0 Male', value: 'v2/en_speaker_0' },
					{ name: '[EN] Speaker 1 Male', value: 'v2/en_speaker_1' },
					{ name: '[EN] Speaker 2 Male', value: 'v2/en_speaker_2' },
					{ name: '[EN] Speaker 3 Male', value: 'v2/en_speaker_3' },
					{ name: '[EN] Speaker 4 Male', value: 'v2/en_speaker_4' },
					{ name: '[EN] Speaker 5 Male', value: 'v2/en_speaker_5' },
					{ name: '[EN] Speaker 6 Male', value: 'v2/en_speaker_6' },
					{ name: '[EN] Speaker 7 Male', value: 'v2/en_speaker_7' },
					{ name: '[EN] Speaker 8 Male', value: 'v2/en_speaker_8' },
					{ name: '[EN] Speaker 9 Female', value: 'v2/en_speaker_9' },
					{ name: '[ES] Speaker 0 Male', value: 'v2/es_speaker_0' },
					{ name: '[ES] Speaker 1 Male', value: 'v2/es_speaker_1' },
					{ name: '[ES] Speaker 2 Male', value: 'v2/es_speaker_2' },
					{ name: '[ES] Speaker 3 Male', value: 'v2/es_speaker_3' },
					{ name: '[ES] Speaker 4 Male', value: 'v2/es_speaker_4' },
					{ name: '[ES] Speaker 5 Male', value: 'v2/es_speaker_5' },
					{ name: '[ES] Speaker 6 Male', value: 'v2/es_speaker_6' },
					{ name: '[ES] Speaker 7 Male', value: 'v2/es_speaker_7' },
					{ name: '[ES] Speaker 8 Female', value: 'v2/es_speaker_8' },
					{ name: '[ES] Speaker 9 Female', value: 'v2/es_speaker_9' },
					{ name: '[FR] Speaker 0 Male', value: 'v2/fr_speaker_0' },
					{ name: '[FR] Speaker 1 Female', value: 'v2/fr_speaker_1' },
					{ name: '[FR] Speaker 2 Female', value: 'v2/fr_speaker_2' },
					{ name: '[FR] Speaker 3 Male', value: 'v2/fr_speaker_3' },
					{ name: '[FR] Speaker 4 Male', value: 'v2/fr_speaker_4' },
					{ name: '[FR] Speaker 5 Female', value: 'v2/fr_speaker_5' },
					{ name: '[FR] Speaker 6 Male', value: 'v2/fr_speaker_6' },
					{ name: '[FR] Speaker 7 Male', value: 'v2/fr_speaker_7' },
					{ name: '[FR] Speaker 8 Male', value: 'v2/fr_speaker_8' },
					{ name: '[FR] Speaker 9 Male', value: 'v2/fr_speaker_9' },
					{ name: '[HI] Speaker 0 Female', value: 'v2/hi_speaker_0' },
					{ name: '[HI] Speaker 1 Female', value: 'v2/hi_speaker_1' },
					{ name: '[HI] Speaker 2 Male', value: 'v2/hi_speaker_2' },
					{ name: '[HI] Speaker 3 Female', value: 'v2/hi_speaker_3' },
					{ name: '[HI] Speaker 4 Female', value: 'v2/hi_speaker_4' },
					{ name: '[HI] Speaker 5 Male', value: 'v2/hi_speaker_5' },
					{ name: '[HI] Speaker 6 Male', value: 'v2/hi_speaker_6' },
					{ name: '[HI] Speaker 7 Male', value: 'v2/hi_speaker_7' },
					{ name: '[HI] Speaker 8 Male', value: 'v2/hi_speaker_8' },
					{ name: '[HI] Speaker 9 Female', value: 'v2/hi_speaker_9' },
					{ name: '[IT] Speaker 0 Male', value: 'v2/it_speaker_0' },
					{ name: '[IT] Speaker 1 Male', value: 'v2/it_speaker_1' },
					{ name: '[IT] Speaker 2 Female', value: 'v2/it_speaker_2' },
					{ name: '[IT] Speaker 3 Male', value: 'v2/it_speaker_3' },
					{ name: '[IT] Speaker 4 Male', value: 'v2/it_speaker_4' },
					{ name: '[IT] Speaker 5 Male', value: 'v2/it_speaker_5' },
					{ name: '[IT] Speaker 6 Male', value: 'v2/it_speaker_6' },
					{ name: '[IT] Speaker 7 Female', value: 'v2/it_speaker_7' },
					{ name: '[IT] Speaker 8 Male', value: 'v2/it_speaker_8' },
					{ name: '[IT] Speaker 9 Female', value: 'v2/it_speaker_9' },
					{ name: '[JA] Speaker 0 Female', value: 'v2/ja_speaker_0' },
					{ name: '[JA] Speaker 1 Female', value: 'v2/ja_speaker_1' },
					{ name: '[JA] Speaker 2 Male', value: 'v2/ja_speaker_2' },
					{ name: '[JA] Speaker 3 Female', value: 'v2/ja_speaker_3' },
					{ name: '[JA] Speaker 4 Female', value: 'v2/ja_speaker_4' },
					{ name: '[JA] Speaker 5 Female', value: 'v2/ja_speaker_5' },
					{ name: '[JA] Speaker 6 Male', value: 'v2/ja_speaker_6' },
					{ name: '[JA] Speaker 7 Female', value: 'v2/ja_speaker_7' },
					{ name: '[JA] Speaker 8 Female', value: 'v2/ja_speaker_8' },
					{ name: '[JA] Speaker 9 Female', value: 'v2/ja_speaker_9' },
					{ name: '[KO] Speaker 0 Female', value: 'v2/ko_speaker_0' },
					{ name: '[KO] Speaker 1 Male', value: 'v2/ko_speaker_1' },
					{ name: '[KO] Speaker 2 Male', value: 'v2/ko_speaker_2' },
					{ name: '[KO] Speaker 3 Male', value: 'v2/ko_speaker_3' },
					{ name: '[KO] Speaker 4 Male', value: 'v2/ko_speaker_4' },
					{ name: '[KO] Speaker 5 Male', value: 'v2/ko_speaker_5' },
					{ name: '[KO] Speaker 6 Male', value: 'v2/ko_speaker_6' },
					{ name: '[KO] Speaker 7 Male', value: 'v2/ko_speaker_7' },
					{ name: '[KO] Speaker 8 Male', value: 'v2/ko_speaker_8' },
					{ name: '[KO] Speaker 9 Male', value: 'v2/ko_speaker_9' },
					{ name: '[PL] Speaker 0 Male', value: 'v2/pl_speaker_0' },
					{ name: '[PL] Speaker 1 Male', value: 'v2/pl_speaker_1' },
					{ name: '[PL] Speaker 2 Male', value: 'v2/pl_speaker_2' },
					{ name: '[PL] Speaker 3 Male', value: 'v2/pl_speaker_3' },
					{ name: '[PL] Speaker 4 Female', value: 'v2/pl_speaker_4' },
					{ name: '[PL] Speaker 5 Male', value: 'v2/pl_speaker_5' },
					{ name: '[PL] Speaker 6 Female', value: 'v2/pl_speaker_6' },
					{ name: '[PL] Speaker 7 Male', value: 'v2/pl_speaker_7' },
					{ name: '[PL] Speaker 8 Male', value: 'v2/pl_speaker_8' },
					{ name: '[PL] Speaker 9 Female', value: 'v2/pl_speaker_9' },
					{ name: '[PT] Speaker 0 Male', value: 'v2/pt_speaker_0' },
					{ name: '[PT] Speaker 1 Male', value: 'v2/pt_speaker_1' },
					{ name: '[PT] Speaker 2 Male', value: 'v2/pt_speaker_2' },
					{ name: '[PT] Speaker 3 Male', value: 'v2/pt_speaker_3' },
					{ name: '[PT] Speaker 4 Male', value: 'v2/pt_speaker_4' },
					{ name: '[PT] Speaker 5 Male', value: 'v2/pt_speaker_5' },
					{ name: '[PT] Speaker 6 Male', value: 'v2/pt_speaker_6' },
					{ name: '[PT] Speaker 7 Male', value: 'v2/pt_speaker_7' },
					{ name: '[PT] Speaker 8 Male', value: 'v2/pt_speaker_8' },
					{ name: '[PT] Speaker 9 Male', value: 'v2/pt_speaker_9' },
					{ name: '[RU] Speaker 0 Male', value: 'v2/ru_speaker_0' },
					{ name: '[RU] Speaker 1 Male', value: 'v2/ru_speaker_1' },
					{ name: '[RU] Speaker 2 Male', value: 'v2/ru_speaker_2' },
					{ name: '[RU] Speaker 3 Male', value: 'v2/ru_speaker_3' },
					{ name: '[RU] Speaker 4 Male', value: 'v2/ru_speaker_4' },
					{ name: '[RU] Speaker 5 Female', value: 'v2/ru_speaker_5' },
					{ name: '[RU] Speaker 6 Female', value: 'v2/ru_speaker_6' },
					{ name: '[RU] Speaker 7 Male', value: 'v2/ru_speaker_7' },
					{ name: '[RU] Speaker 8 Male', value: 'v2/ru_speaker_8' },
					{ name: '[RU] Speaker 9 Female', value: 'v2/ru_speaker_9' },
					{ name: '[TR] Speaker 0 Male', value: 'v2/tr_speaker_0' },
					{ name: '[TR] Speaker 1 Male', value: 'v2/tr_speaker_1' },
					{ name: '[TR] Speaker 2 Male', value: 'v2/tr_speaker_2' },
					{ name: '[TR] Speaker 3 Male', value: 'v2/tr_speaker_3' },
					{ name: '[TR] Speaker 4 Female', value: 'v2/tr_speaker_4' },
					{ name: '[TR] Speaker 5 Female', value: 'v2/tr_speaker_5' },
					{ name: '[TR] Speaker 6 Male', value: 'v2/tr_speaker_6' },
					{ name: '[TR] Speaker 7 Male', value: 'v2/tr_speaker_7' },
					{ name: '[TR] Speaker 8 Male', value: 'v2/tr_speaker_8' },
					{ name: '[TR] Speaker 9 Male', value: 'v2/tr_speaker_9' },
					{ name: '[ZH] Speaker 0 Male', value: 'v2/zh_speaker_0' },
					{ name: '[ZH] Speaker 1 Male', value: 'v2/zh_speaker_1' },
					{ name: '[ZH] Speaker 2 Male', value: 'v2/zh_speaker_2' },
					{ name: '[ZH] Speaker 3 Male', value: 'v2/zh_speaker_3' },
					{ name: '[ZH] Speaker 4 Female', value: 'v2/zh_speaker_4' },
					{ name: '[ZH] Speaker 5 Male', value: 'v2/zh_speaker_5' },
					{ name: '[ZH] Speaker 6 Female', value: 'v2/zh_speaker_6' },
					{ name: '[ZH] Speaker 7 Female', value: 'v2/zh_speaker_7' },
					{ name: '[ZH] Speaker 8 Male', value: 'v2/zh_speaker_8' },
					{ name: '[ZH] Speaker 9 Female', value: 'v2/zh_speaker_9' },
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

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/suno-ai/bark',
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
