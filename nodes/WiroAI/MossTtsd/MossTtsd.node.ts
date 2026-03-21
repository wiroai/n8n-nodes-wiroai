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

export class MossTtsd implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - MOSS-TTSD',
		name: 'mossTtsd',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'MOSS-TTSD is a production long-form dialogue model for expressive multi-speaker conversational',
		defaults: {
			name: 'Wiro - MOSS-TTSD',
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
				displayName: 'Dialogue',
				name: 'dialogue',
				type: 'string',
				default: '',
				description: 'The text to generate audio from',
			},
			{
				displayName: 'Speaker 1 Reference Audio URL',
				name: 'inputAudio1Url',
				type: 'string',
				default: '',
				description: 'Speaker 1 reference audio for voice cloning (optional). Must be provided together with Speaker 1 Text. Supported formats: .wav, .mp3, .m4a and .webm',
			},
			{
				displayName: 'Speaker 1 Text',
				name: 'inputText1',
				type: 'string',
				default: '',
				description: 'Speaker 1 prompt text for voice cloning (optional). Must be provided together with Speaker 1 Reference Audio. The [S1] tag is added automatically if missing',
			},
			{
				displayName: 'Speaker 2 Reference Audio URL',
				name: 'inputAudio2Url',
				type: 'string',
				default: '',
				description: 'Speaker 2 reference audio for voice cloning (optional). Must be provided together with Speaker 2 Text. Supported formats: .wav, .mp3, .m4a and .webm',
			},
			{
				displayName: 'Speaker 2 Text',
				name: 'inputText2',
				type: 'string',
				default: '',
				description: 'Speaker 2 prompt text for voice cloning (optional). Must be provided together with Speaker 2 Reference Audio. The [S2] tag is added automatically if missing',
			},
			{
				displayName: 'Speaker 3 Reference Audio URL',
				name: 'inputAudio3Url',
				type: 'string',
				default: '',
				description: 'Speaker 3 reference audio for voice cloning (optional). Must be provided together with Speaker 3 Text. Supported formats: .wav, .mp3, .m4a and .webm',
			},
			{
				displayName: 'Speaker 3 Text',
				name: 'inputText3',
				type: 'string',
				default: '',
				description: 'Speaker 3 prompt text for voice cloning (optional). Must be provided together with Speaker 3 Reference Audio. The [S3] tag is added automatically if missing',
			},
			{
				displayName: 'Speaker 4 Reference Audio URL',
				name: 'inputAudio4Url',
				type: 'string',
				default: '',
				description: 'Speaker 4 reference audio for voice cloning (optional). Must be provided together with Speaker 4 Text. Supported formats: .wav, .mp3, .m4a and .webm',
			},
			{
				displayName: 'Speaker 4 Text',
				name: 'inputText4',
				type: 'string',
				default: '',
				description: 'Speaker 4 prompt text for voice cloning (optional). Must be provided together with Speaker 4 Reference Audio. The [S4] tag is added automatically if missing',
			},
			{
				displayName: 'Speaker 5 Reference Audio URL',
				name: 'inputAudio5Url',
				type: 'string',
				default: '',
				description: 'Speaker 5 reference audio for voice cloning (optional). Must be provided together with Speaker 5 Text. Supported formats: .wav, .mp3, .m4a and .webm',
			},
			{
				displayName: 'Speaker 5 Text',
				name: 'inputText5',
				type: 'string',
				default: '',
				description: 'Speaker 5 prompt text for voice cloning (optional). Must be provided together with Speaker 5 Reference Audio. The [S5] tag is added automatically if missing',
			},
			{
				displayName: 'Text Normalize',
				name: 'textNormalize',
				type: 'boolean',
				default: false,
				description: 'Whether to enable normalize dialogue text (removes special characters, fixes punctuation). enabled by default.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const dialogue = this.getNodeParameter('dialogue', 0, '') as string;
		const inputAudio1Url = this.getNodeParameter('inputAudio1Url', 0, '') as string;
		const inputText1 = this.getNodeParameter('inputText1', 0, '') as string;
		const inputAudio2Url = this.getNodeParameter('inputAudio2Url', 0, '') as string;
		const inputText2 = this.getNodeParameter('inputText2', 0, '') as string;
		const inputAudio3Url = this.getNodeParameter('inputAudio3Url', 0, '') as string;
		const inputText3 = this.getNodeParameter('inputText3', 0, '') as string;
		const inputAudio4Url = this.getNodeParameter('inputAudio4Url', 0, '') as string;
		const inputText4 = this.getNodeParameter('inputText4', 0, '') as string;
		const inputAudio5Url = this.getNodeParameter('inputAudio5Url', 0, '') as string;
		const inputText5 = this.getNodeParameter('inputText5', 0, '') as string;
		const textNormalize = this.getNodeParameter('textNormalize', 0, false) as boolean;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/OpenMOSS/MOSS-TTSD',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				dialogue,
				inputAudio1Url,
				inputText1,
				inputAudio2Url,
				inputText2,
				inputAudio3Url,
				inputText3,
				inputAudio4Url,
				inputText4,
				inputAudio5Url,
				inputText5,
				textNormalize,
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
