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

export class TextToSongAceStep15 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Song',
		name: 'textToSongAceStep15',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'ACE-Step v1.5 is a highly efficient open-source music foundation model designed to bring commer',
		defaults: {
			name: 'Wiro - Text To Song',
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
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				description: 'Free-text description of the desired music. If caption is provided, the tags parameter is completely ignored. If caption is empty, it is automatically built from tags',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Song lyrics for vocal generation. If instrumental=\'true\', lyrics are ignored and replaced with [Instrumental] regardless of content. If instrumental is not sent, the behavior is auto-detected: empty lyrics default to [Instrumental], non-empty lyrics are used as-is',
			},
			{
				displayName: 'Reference Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Upload a song to use as style inspiration',
			},
			{
				displayName: 'Genre',
				name: 'genre',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Select one or more values for genre',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Instrument',
				name: 'instrument',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Select one or more values for instrument',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Mood',
				name: 'mood',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Select one or more values for mood',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Select one or more values for gender',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Timbre',
				name: 'timbre',
				type: 'multiOptions',
				default: [],
				required: true,
				description: 'Select one or more values for timbre',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				description: 'Total duration of the generated audio (in seconds)',
				options: [
					{ name: '10', value: '10' },
					{ name: '120', value: '120' },
					{ name: '180', value: '180' },
					{ name: '240', value: '240' },
					{ name: '30', value: '30' },
					{ name: '60', value: '60' },
					{ name: '90', value: '90' },
				],
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'ar',
				required: true,
				description: 'Language of the vocals. Default: Auto.',
				options: [
					{ name: 'Arabic', value: 'ar' },
					{ name: 'Auto', value: 'auto' },
					{ name: 'Azerbaijani', value: 'az' },
					{ name: 'Bengali', value: 'bn' },
					{ name: 'Bulgarian', value: 'bg' },
					{ name: 'Cantonese', value: 'yue' },
					{ name: 'Catalan', value: 'ca' },
					{ name: 'Chinese', value: 'zh' },
					{ name: 'Croatian', value: 'hr' },
					{ name: 'Czech', value: 'cs' },
					{ name: 'Danish', value: 'da' },
					{ name: 'Dutch', value: 'nl' },
					{ name: 'English', value: 'en' },
					{ name: 'Filipino', value: 'tl' },
					{ name: 'Finnish', value: 'fi' },
					{ name: 'French', value: 'fr' },
					{ name: 'German', value: 'de' },
					{ name: 'Greek', value: 'el' },
					{ name: 'Hebrew', value: 'he' },
					{ name: 'Hindi', value: 'hi' },
					{ name: 'Hungarian', value: 'hu' },
					{ name: 'Icelandic', value: 'is' },
					{ name: 'Indonesian', value: 'id' },
					{ name: 'Italian', value: 'it' },
					{ name: 'Japanese', value: 'ja' },
					{ name: 'Korean', value: 'ko' },
					{ name: 'Latin', value: 'la' },
					{ name: 'Lithuanian', value: 'lt' },
					{ name: 'Malay', value: 'ms' },
					{ name: 'Nepali', value: 'ne' },
					{ name: 'Norwegian', value: 'no' },
					{ name: 'Persian', value: 'fa' },
					{ name: 'Polish', value: 'pl' },
					{ name: 'Portuguese', value: 'pt' },
					{ name: 'Punjabi', value: 'pa' },
					{ name: 'Romanian', value: 'ro' },
					{ name: 'Russian', value: 'ru' },
					{ name: 'Serbian', value: 'sr' },
					{ name: 'Slovak', value: 'sk' },
					{ name: 'Spanish', value: 'es' },
					{ name: 'Swahili', value: 'sw' },
					{ name: 'Swedish', value: 'sv' },
					{ name: 'Tamil', value: 'ta' },
					{ name: 'Telugu', value: 'te' },
					{ name: 'Thai', value: 'th' },
					{ name: 'Turkish', value: 'tr' },
					{ name: 'Ukrainian', value: 'uk' },
					{ name: 'Urdu', value: 'ur' },
					{ name: 'Vietnamese', value: 'vi' },
				],
			},
			{
				displayName: 'Bpm',
				name: 'bpm',
				type: 'number',
				default: 0,
				description: 'Set the tempo (e.g. 80 for slow ballad, 128 for dance). Leave 0 to let AI decide. Default: 0',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Init Lm',
				name: 'initLm',
				type: 'boolean',
				default: false,
				description: 'Whether to enable enable ai-powered music planning for better results. default: true.',
			},
			{
				displayName: 'Instrumental',
				name: 'instrumental',
				type: 'boolean',
				default: false,
				description: 'Whether to make the output instrumental. When enabled, lyrics are ignored and replaced with [Instrumental]. When disabled, lyrics are used as-is but fall back to [Instrumental] if empty',
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

		const caption = this.getNodeParameter('caption', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const genre = this.getNodeParameter('genre', 0) as string;
		const instrument = this.getNodeParameter('instrument', 0) as string;
		const mood = this.getNodeParameter('mood', 0) as string;
		const gender = this.getNodeParameter('gender', 0) as string;
		const timbre = this.getNodeParameter('timbre', 0) as string;
		const duration = this.getNodeParameter('duration', 0, '') as string;
		const language = this.getNodeParameter('language', 0) as string;
		const bpm = this.getNodeParameter('bpm', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const initLm = this.getNodeParameter('initLm', 0, false) as boolean;
		const instrumental = this.getNodeParameter('instrumental', 0, false) as boolean;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ACE-Step/text-to-song-ACE-Step1.5',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				caption,
				prompt,
				inputAudioUrl,
				genre,
				instrument,
				mood,
				gender,
				timbre,
				duration,
				language,
				bpm,
				steps,
				scale,
				initLm,
				instrumental,
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
