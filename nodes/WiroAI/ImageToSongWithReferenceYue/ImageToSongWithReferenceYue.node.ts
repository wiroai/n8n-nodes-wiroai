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

export class ImageToSongWithReferenceYue implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image To Song With Reference Yue',
		name: 'imageToSongWithReferenceYue',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Turn any song into your own with AI. Simply upload a reference track and provide your image — A',
		defaults: {
			name: 'Wiro - Image To Song With Reference Yue',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Init-image-help',
			},
			{
				displayName: 'Reference Song URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Upload a reference song that captures the style, vibe, or sound you want. AI will use this track as inspiration to recreate your lyrics in a similar musical style.',
			},
			{
				displayName: 'Reference Song Clone Type',
				name: 'audio_prompt_type',
				type: 'options',
				default: 'both',
				required: true,
				description: 'Vocal: Clone the vocal style and melody of your reference song, but generate a new instrumental. Instrumental: Clone the instrumental style and structure, but generate new vocals from your lyrics. Both: Clone both the vocal style and instrumental feel to closely match your reference song while using your custom lyrics',
				options: [
					{ name: 'Both', value: 'both' },
					{ name: 'Instrumental', value: 'instrumental' },
					{ name: 'Vocal', value: 'vocal' },
				],
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

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const audio_prompt_type = this.getNodeParameter('audio_prompt_type', 0) as string;
		const genre = this.getNodeParameter('genre', 0) as string;
		const instrument = this.getNodeParameter('instrument', 0) as string;
		const mood = this.getNodeParameter('mood', 0) as string;
		const gender = this.getNodeParameter('gender', 0) as string;
		const timbre = this.getNodeParameter('timbre', 0) as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/image-to-song-with-reference-YuE',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputAudioUrl,
				audio_prompt_type,
				genre,
				instrument,
				mood,
				gender,
				timbre,
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
