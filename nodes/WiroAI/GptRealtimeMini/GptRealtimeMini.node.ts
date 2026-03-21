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

export class GptRealtimeMini implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - GPT Mini Realtime Voice Assistant - OpenAI Model',
		name: 'gptRealtimeMini',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'GPT Mini Realtime enables low-latency, bidirectional streaming for voice and text. Build intera',
		defaults: {
			name: 'Wiro - GPT Mini Realtime Voice Assistant - OpenAI Model',
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
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				default: 'alloy',
				required: true,
				description: 'Required. The voice of the AI assistant.',
				options: [
					{ name: 'Alloy Neutral, Balanced', value: 'alloy' },
					{ name: 'Ash Warm, Narrative', value: 'ash' },
					{ name: 'Ballad Soft, Calm', value: 'ballad' },
					{ name: 'Cedar Clear, Confident (Recommended)', value: 'cedar' },
					{ name: 'Coral Lively, Energetic', value: 'coral' },
					{ name: 'Echo Neutral, Mechanical', value: 'echo' },
					{ name: 'Fable Expressive, Storytelling', value: 'fable' },
					{ name: 'Marin Natural, Warm (Recommended)', value: 'marin' },
					{ name: 'Nova Friendly, Conversational', value: 'nova' },
					{ name: 'Onyx Deep, Authoritative', value: 'onyx' },
					{ name: 'Sage Authoritative, Knowledgeable', value: 'sage' },
					{ name: 'Shimmer Bright, Positive', value: 'shimmer' },
					{ name: 'Verse Serious, Professional', value: 'verse' },
				],
			},
			{
				displayName: 'System Instructions',
				name: 'system_instructions',
				type: 'string',
				default: '',
				required: true,
				description: 'Required. Instructions that define the AI assistant\'s behavior and personality.',
			},
			{
				displayName: 'Transcription Model',
				name: 'transcription_model',
				type: 'options',
				default: 'gpt-4o-mini-transcribe',
				description: 'Optional. Model used for transcribing user speech to text.',
				options: [
					{ name: 'GPT 4o Mini Transcribe Fast, Lightweight', value: 'gpt-4o-mini-transcribe' },
					{ name: 'GPT 4o Transcribe Higher Quality', value: 'gpt-4o-transcribe' },
					{ name: 'Whisper 1 Stable, Widely Supported', value: 'whisper-1' },
				],
			},
			{
				displayName: 'Input Audio Format',
				name: 'input_audio_format',
				type: 'options',
				default: 'audio/pcmu',
				description: 'Optional. Audio format for user microphone input.',
				options: [
					{ name: 'G.711 A Law (VoIP)', value: 'audio/pcma' },
					{ name: 'G.711 U Law (VoIP)', value: 'audio/pcmu' },
					{ name: 'PCM 16 Bit (Best Quality)', value: 'audio/pcm' },
				],
			},
			{
				displayName: 'Output Audio Format',
				name: 'output_audio_format',
				type: 'options',
				default: 'audio/pcmu',
				description: 'Optional. Audio format for AI voice output.',
				options: [
					{ name: 'G.711 A Law (VoIP)', value: 'audio/pcma' },
					{ name: 'G.711 U Law (VoIP)', value: 'audio/pcmu' },
					{ name: 'PCM 16 Bit (Best Quality)', value: 'audio/pcm' },
				],
			},
			{
				displayName: 'Input Audio Rate',
				name: 'input_audio_rate',
				type: 'options',
				default: '24000',
				description: 'Optional. Sample rate for user microphone input.',
				options: [
					{ name: '24kHz (Recommended)', value: '24000' },
					{ name: '8kHz (Phone Quality)', value: '8000' },
				],
			},
			{
				displayName: 'Output Audio Rate',
				name: 'output_audio_rate',
				type: 'options',
				default: '24000',
				description: 'Optional. Sample rate for AI voice output.',
				options: [
					{ name: '24kHz (Recommended)', value: '24000' },
					{ name: '8kHz (Phone Quality)', value: '8000' },
				],
			},
			{
				displayName: 'Turn Detection Threshold',
				name: 'turn_detection_threshold',
				type: 'number',
				default: 0,
				description: 'Optional. Voice activity detection sensitivity. Lower = more sensitive, higher = less sensitive',
			},
			{
				displayName: 'Silence Duration (Ms)',
				name: 'turn_detection_silence_ms',
				type: 'number',
				default: 0,
				description: 'Optional. How long the user must be silent (in ms) before AI starts responding. Default: 500ms',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const voice = this.getNodeParameter('voice', 0) as string;
		const system_instructions = this.getNodeParameter('system_instructions', 0) as string;
		const transcription_model = this.getNodeParameter('transcription_model', 0, '') as string;
		const input_audio_format = this.getNodeParameter('input_audio_format', 0, '') as string;
		const output_audio_format = this.getNodeParameter('output_audio_format', 0, '') as string;
		const input_audio_rate = this.getNodeParameter('input_audio_rate', 0, '') as string;
		const output_audio_rate = this.getNodeParameter('output_audio_rate', 0, '') as string;
		const turn_detection_threshold = this.getNodeParameter('turn_detection_threshold', 0, 0) as number;
		const turn_detection_silence_ms = this.getNodeParameter('turn_detection_silence_ms', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/openai/gpt-realtime-mini',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				voice,
				system_instructions,
				transcription_model,
				input_audio_format,
				output_audio_format,
				input_audio_rate,
				output_audio_rate,
				turn_detection_threshold,
				turn_detection_silence_ms,
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
