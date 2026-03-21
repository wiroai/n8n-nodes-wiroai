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

export class RealtimeConversationalAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Realtime Conversational AI by ElevenLabs',
		name: 'realtimeConversationalAi',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Build real-time conversational AI with ElevenLabs\' voice agent. Configure voice, language, and',
		defaults: {
			name: 'Wiro - Realtime Conversational AI by ElevenLabs',
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
				name: 'voice_id',
				type: 'options',
				default: 'Xb7hH8MSUJpSbSDYk0k2',
				required: true,
				description: 'Required. The voice of the AI agent.',
				options: [
					{ name: 'Alice Confident, British', value: 'Xb7hH8MSUJpSbSDYk0k2' },
					{ name: 'Bill Trustworthy, American', value: 'pqHfZKP75CvOlQylNhV4' },
					{ name: 'Brian Deep, Narrator', value: 'nPczCjzI2devNBz1zQrb' },
					{ name: 'Callum Intense, Transatlantic', value: 'N2lVS1w4EtoT3dr4eOWO' },
					{ name: 'Charlie Casual, Australian', value: 'IKne3meq5aSn9XLyUdCD' },
					{ name: 'Charlotte Seductive, Swedish', value: 'XB0fDUnXU5powFXDhCwa' },
					{ name: 'Daniel Deep, Authoritative, British', value: 'onwK4e9ZLuTAKqWW03F9' },
					{ name: 'George Warm, British', value: 'JBFqnCBsd6RMkjVDRZzb' },
					{ name: 'Laura Upbeat, Conversational', value: 'FGY2WhTYpPnrIDTdsKH5' },
					{ name: 'Matilda Warm, Friendly', value: 'XrExE9yKIg1WjnnlVkGX' },
					{ name: 'Rachel Warm, Calm (Recommended)', value: '21m00Tcm4TlvDq8ikWAM' },
					{ name: 'Sarah Soft, Friendly', value: 'EXAVITQu4vr4xnSDxMaL' },
				],
			},
			{
				displayName: 'System Instructions',
				name: 'system_instructions',
				type: 'string',
				default: '',
				required: true,
				description: 'Required. Instructions that define the AI agent\'s behavior and personality.',
			},
			{
				displayName: 'First Message',
				name: 'first_message',
				type: 'string',
				default: '',
				description: 'Optional. The greeting message the agent says when the conversation starts.',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'ar',
				description: 'Optional. Language for the AI agent. Default: English',
				options: [
					{ name: 'Arabic', value: 'ar' },
					{ name: 'Auto', value: 'auto' },
					{ name: 'Chinese', value: 'zh' },
					{ name: 'Dutch', value: 'nl' },
					{ name: 'English', value: 'en' },
					{ name: 'French', value: 'fr' },
					{ name: 'German', value: 'de' },
					{ name: 'Hindi', value: 'hi' },
					{ name: 'Italian', value: 'it' },
					{ name: 'Japanese', value: 'ja' },
					{ name: 'Korean', value: 'ko' },
					{ name: 'Polish', value: 'pl' },
					{ name: 'Portuguese', value: 'pt' },
					{ name: 'Russian', value: 'ru' },
					{ name: 'Spanish', value: 'es' },
					{ name: 'Swedish', value: 'sv' },
					{ name: 'Turkish', value: 'tr' },
				],
			},
			{
				displayName: 'TTS Model',
				name: 'tts_model_id',
				type: 'options',
				default: 'eleven_flash_v2_5',
				description: 'Optional. Text-to-speech model. Turbo is fastest, Multilingual is highest quality',
				options: [
					{ name: 'Flash V2.5 Fastest, Lowest Latency', value: 'eleven_flash_v2_5' },
					{ name: 'Multilingual V2 Higher Quality, Multi Language', value: 'eleven_multilingual_v2' },
					{ name: 'Turbo V2 Fast, Low Latency (Recommended)', value: 'eleven_turbo_v2' },
				],
			},
			{
				displayName: 'Turn Timeout (Seconds)',
				name: 'turn_timeout',
				type: 'number',
				default: 0,
				description: 'Optional. How long the agent waits for user to respond before re-prompting. Default: 7 seconds',
			},
			{
				displayName: 'Silence Auto Close (Seconds)',
				name: 'silence_end_call_timeout',
				type: 'number',
				default: 0,
				description: 'Optional. Auto-close session after this many seconds of user silence. Default: 30 seconds',
			},
			{
				displayName: 'Max Session Duration (Seconds)',
				name: 'max_duration_seconds',
				type: 'number',
				default: 0,
				description: 'Optional. Maximum total session length. Default: 600 seconds (10 minutes)',
			},
			{
				displayName: 'Turn Eagerness',
				name: 'turn_eagerness',
				type: 'options',
				default: 'high',
				description: 'Optional. How eagerly the agent jumps in to respond. Low = patient, High = fast-paced',
				options: [
					{ name: 'High Quick Responses, Fast Paced Dialogue', value: 'high' },
					{ name: 'Low Patient, Waits For User To Finish', value: 'low' },
					{ name: 'Normal (Default)', value: 'normal' },
				],
			},
			{
				displayName: 'Auto End Call',
				name: 'end_call',
				type: 'options',
				default: '0',
				description: 'Optional. Allow the agent to automatically end the call when the conversation is complete. Default: Enabled',
				options: [
					{ name: 'Disabled Agent Cannot End The Call', value: '0' },
					{ name: 'Enabled Agent Can End The Call When Conversation Is Done (Recommended)', value: '1' },
				],
			},
			{
				displayName: 'Speech Speed',
				name: 'speed',
				type: 'number',
				default: 0,
				description: 'Optional. Speech speed multiplier. 1 = normal, lower = slower, higher = faster',
			},
			{
				displayName: 'Voice Stability',
				name: 'stability',
				type: 'number',
				default: 0,
				description: 'Optional. Voice consistency. Higher = more stable but monotone, lower = more expressive but variable',
			},
			{
				displayName: 'Voice Similarity',
				name: 'similarity_boost',
				type: 'number',
				default: 0,
				description: 'Optional. How closely the output matches the selected voice. Higher = more similar',
			},
			{
				displayName: 'Streaming Latency Optimization',
				name: 'optimize_streaming_latency',
				type: 'options',
				default: '0',
				description: 'Optional. Trade-off between audio quality and response speed. Higher = faster but lower quality',
				options: [
					{ name: '0 No Optimization (Best Quality)', value: '0' },
					{ name: '1 Slight Optimization', value: '1' },
					{ name: '2 Moderate Optimization', value: '2' },
					{ name: '3 Good Balance (Recommended)', value: '3' },
					{ name: '4 Maximum Optimization (Lowest Latency)', value: '4' },
				],
			},
			{
				displayName: 'Output Audio Format',
				name: 'output_audio_format',
				type: 'options',
				default: 'ulaw_8000',
				description: 'Optional. Audio format for AI voice output. Must match the frontend audio player sample rate',
				options: [
					{ name: 'PCM 16kHz (Default)', value: 'pcm_16000' },
					{ name: 'PCM 22.05kHz', value: 'pcm_22050' },
					{ name: 'PCM 24kHz (Recommended)', value: 'pcm_24000' },
					{ name: 'PCM 44.1kHz (High Quality)', value: 'pcm_44100' },
					{ name: 'U Law 8kHz (Telephony)', value: 'ulaw_8000' },
				],
			},
			{
				displayName: 'Input Audio Format',
				name: 'input_audio_format',
				type: 'options',
				default: 'pcm_16000',
				description: 'Optional. Audio format for user microphone input. Must match the frontend audio recorder sample rate',
				options: [
					{ name: 'PCM 16kHz (Default)', value: 'pcm_16000' },
					{ name: 'PCM 22.05kHz', value: 'pcm_22050' },
					{ name: 'PCM 24kHz (Recommended)', value: 'pcm_24000' },
					{ name: 'PCM 44.1kHz (High Quality)', value: 'pcm_44100' },
				],
			},
			{
				displayName: 'Server Tools (JSON)',
				name: 'server_tools',
				type: 'string',
				default: '',
				description: 'Optional. JSON array of webhook tools the agent can call during conversation. Example: [{"name": "get_weather", "description": "When user asks about weather", "method": "GET", "URL": "https://api.example.com/weather/{city}", "path_parameters": [{"name": "city", "type": "string", "description": "City name"}]}, {"name": "create_order", "description": "When user wants to place an order", "method": "POST", "URL": "https://api.example.com/orders", "headers": {"Authorization": "Bearer YOUR_KEY"}, "body_parameters": [{"name": "product", "type": "string", "description": "Product name"}, {"name": "quantity", "type": "number", "description": "Quantity"}]}]',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const voice_id = this.getNodeParameter('voice_id', 0) as string;
		const system_instructions = this.getNodeParameter('system_instructions', 0) as string;
		const first_message = this.getNodeParameter('first_message', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;
		const tts_model_id = this.getNodeParameter('tts_model_id', 0, '') as string;
		const turn_timeout = this.getNodeParameter('turn_timeout', 0, 0) as number;
		const silence_end_call_timeout = this.getNodeParameter('silence_end_call_timeout', 0, 0) as number;
		const max_duration_seconds = this.getNodeParameter('max_duration_seconds', 0, 0) as number;
		const turn_eagerness = this.getNodeParameter('turn_eagerness', 0, '') as string;
		const end_call = this.getNodeParameter('end_call', 0, '') as string;
		const speed = this.getNodeParameter('speed', 0, 0) as number;
		const stability = this.getNodeParameter('stability', 0, 0) as number;
		const similarity_boost = this.getNodeParameter('similarity_boost', 0, 0) as number;
		const optimize_streaming_latency = this.getNodeParameter('optimize_streaming_latency', 0, '') as string;
		const output_audio_format = this.getNodeParameter('output_audio_format', 0, '') as string;
		const input_audio_format = this.getNodeParameter('input_audio_format', 0, '') as string;
		const server_tools = this.getNodeParameter('server_tools', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/elevenlabs/Realtime Conversational AI',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				voice_id,
				system_instructions,
				first_message,
				language,
				tts_model_id,
				turn_timeout,
				silence_end_call_timeout,
				max_duration_seconds,
				turn_eagerness,
				end_call,
				speed,
				stability,
				similarity_boost,
				optimize_streaming_latency,
				output_audio_format,
				input_audio_format,
				server_tools,
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
