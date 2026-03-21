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

export class WhisperLarge3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Speech to Text',
		name: 'whisperLarge3',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. T',
		defaults: {
			name: 'Wiro - Speech to Text',
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
				displayName: 'Input Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Input-audio-help',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'Afrikaans',
				required: true,
				description: 'Language-help',
				options: [
					{ name: 'Afrikaans', value: 'Afrikaans' },
					{ name: 'Arabic', value: 'Arabic' },
					{ name: 'Auto', value: 'auto' },
					{ name: 'Azerbaijani', value: 'Azerbaijani' },
					{ name: 'Belarusian', value: 'Belarusian' },
					{ name: 'Bosnian', value: 'Bosnian' },
					{ name: 'Bulgarian', value: 'Bulgarian' },
					{ name: 'Catalan', value: 'Catalan' },
					{ name: 'Chinese', value: 'Chinese' },
					{ name: 'Croatian', value: 'Croatian' },
					{ name: 'Czech', value: 'Czech' },
					{ name: 'Danish', value: 'Danish' },
					{ name: 'Dutch', value: 'Dutch' },
					{ name: 'English', value: 'English' },
					{ name: 'Estonian', value: 'Estonian' },
					{ name: 'Finnish', value: 'Finnish' },
					{ name: 'French', value: 'French' },
					{ name: 'Galician', value: 'Galician' },
					{ name: 'German', value: 'German' },
					{ name: 'Greek', value: 'Greek' },
					{ name: 'Hebrew', value: 'Hebrew' },
					{ name: 'Hindi', value: 'Hindi' },
					{ name: 'Hungarian', value: 'Hungarian' },
					{ name: 'Icelandic', value: 'Icelandic' },
					{ name: 'Indonesian', value: 'Indonesian' },
					{ name: 'Italian', value: 'Italian' },
					{ name: 'Japanese', value: 'Japanese' },
					{ name: 'Kannada', value: 'Kannada' },
					{ name: 'Kazakh', value: 'Kazakh' },
					{ name: 'Korean', value: 'Korean' },
					{ name: 'Latvian', value: 'Latvian' },
					{ name: 'Lithuanian', value: 'Lithuanian' },
					{ name: 'Macedonian', value: 'Macedonian' },
					{ name: 'Malay', value: 'Malay' },
					{ name: 'Maori', value: 'Maori' },
					{ name: 'Marathi', value: 'Marathi' },
					{ name: 'Nepali', value: 'Nepali' },
					{ name: 'Norwegian', value: 'Norwegian' },
					{ name: 'Persian', value: 'Persian' },
					{ name: 'Polish', value: 'Polish' },
					{ name: 'Portuguese', value: 'Portuguese' },
					{ name: 'Romanian', value: 'Romanian' },
					{ name: 'Russian', value: 'Russian' },
					{ name: 'Serbian', value: 'Serbian' },
					{ name: 'Slovak', value: 'Slovak' },
					{ name: 'Slovenian', value: 'Slovenian' },
					{ name: 'Spanish', value: 'Spanish' },
					{ name: 'Swahili', value: 'Swahili' },
					{ name: 'Swedish', value: 'Swedish' },
					{ name: 'Tagalog', value: 'Tagalog' },
					{ name: 'Tamil', value: 'Tamil' },
					{ name: 'Thai', value: 'Thai' },
					{ name: 'Turkish', value: 'Turkish' },
					{ name: 'Ukrainian', value: 'Ukrainian' },
					{ name: 'Urdu', value: 'Urdu' },
					{ name: 'Vietnamese', value: 'Vietnamese' },
					{ name: 'Welsh', value: 'Welsh' },
				],
			},
			{
				displayName: 'Max New Tokens',
				name: 'maxNewTokens',
				type: 'number',
				default: 0,
				description: 'Max-new-tokens-help',
			},
			{
				displayName: 'Chunk Length',
				name: 'chunkLength',
				type: 'number',
				default: 0,
				required: true,
				description: 'Chunk-length-help',
			},
			{
				displayName: 'Batch Size',
				name: 'batchSize',
				type: 'number',
				default: 0,
				required: true,
				description: 'Batch-size-help',
			},
			{
				displayName: 'Num Speakers',
				name: 'numSpeakers',
				type: 'number',
				default: 0,
				required: true,
				description: 'Num-speakers-help',
			},
			{
				displayName: 'Diarization',
				name: 'diarization',
				type: 'boolean',
				default: false,
				description: 'Whether to enable diarization-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const language = this.getNodeParameter('language', 0) as string;
		const maxNewTokens = this.getNodeParameter('maxNewTokens', 0, 0) as number;
		const chunkLength = this.getNodeParameter('chunkLength', 0) as number;
		const batchSize = this.getNodeParameter('batchSize', 0) as number;
		const numSpeakers = this.getNodeParameter('numSpeakers', 0) as number;
		const diarization = this.getNodeParameter('diarization', 0, false) as boolean;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/openai/whisper-large-v3',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputAudioUrl,
				language,
				maxNewTokens,
				chunkLength,
				batchSize,
				numSpeakers,
				diarization,
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
