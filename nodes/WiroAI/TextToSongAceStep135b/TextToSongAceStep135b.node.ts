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

export class TextToSongAceStep135b implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Song',
		name: 'textToSongAceStep135b',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate high-quality songs from text prompts in seconds. Whether you\'re crafting instrumental',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The lyrics to generate the song',
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
				name: 'audioDuration',
				type: 'number',
				default: 0,
				description: 'Total duration of the generated audio (in seconds)',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
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
				displayName: 'Scheduler',
				name: 'scheduler',
				type: 'options',
				default: 'euler',
				description: 'Scheduler type',
				options: [
					{ name: 'Euler', value: 'euler' },
					{ name: 'Heun', value: 'heun' },
				],
			},
			{
				displayName: 'Guidance Type',
				name: 'cfg',
				type: 'options',
				default: 'apg',
				description: 'Guidance scale for CFG',
				options: [
					{ name: 'Apg', value: 'apg' },
					{ name: 'Cfg', value: 'cfg' },
					{ name: 'Cfg Star', value: 'cfg_star' },
				],
			},
			{
				displayName: 'Granularity Scale',
				name: 'omegaScale',
				type: 'number',
				default: 0,
				description: 'Omega scale for CFG types',
			},
			{
				displayName: 'Guidance Interval',
				name: 'guidanceInterval',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Guidance Interval Decay',
				name: 'guidanceIntervalDecay',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Min Guidance Scale',
				name: 'minGuidanceScale',
				type: 'number',
				default: 0,
				description: 'Minimum guidance scale',
			},
			{
				displayName: 'Text Guidance Scale',
				name: 'guidanceScaleText',
				type: 'number',
				default: 0,
				description: 'Guidance scale for tags',
			},
			{
				displayName: 'Lyric Guidance Scale',
				name: 'guidanceScaleLyric',
				type: 'number',
				default: 0,
				description: 'Guidance scale for lyrics',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const genre = this.getNodeParameter('genre', 0) as string;
		const instrument = this.getNodeParameter('instrument', 0) as string;
		const mood = this.getNodeParameter('mood', 0) as string;
		const gender = this.getNodeParameter('gender', 0) as string;
		const timbre = this.getNodeParameter('timbre', 0) as string;
		const audioDuration = this.getNodeParameter('audioDuration', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const scheduler = this.getNodeParameter('scheduler', 0, '') as string;
		const cfg = this.getNodeParameter('cfg', 0, '') as string;
		const omegaScale = this.getNodeParameter('omegaScale', 0, 0) as number;
		const guidanceInterval = this.getNodeParameter('guidanceInterval', 0, 0) as number;
		const guidanceIntervalDecay = this.getNodeParameter('guidanceIntervalDecay', 0, 0) as number;
		const minGuidanceScale = this.getNodeParameter('minGuidanceScale', 0, 0) as number;
		const guidanceScaleText = this.getNodeParameter('guidanceScaleText', 0, 0) as number;
		const guidanceScaleLyric = this.getNodeParameter('guidanceScaleLyric', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ACE-Step/text-to-song-ACE-Step-v1-3.5B',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				genre,
				instrument,
				mood,
				gender,
				timbre,
				audioDuration,
				seed,
				steps,
				scale,
				scheduler,
				cfg,
				omegaScale,
				guidanceInterval,
				guidanceIntervalDecay,
				minGuidanceScale,
				guidanceScaleText,
				guidanceScaleLyric,
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
