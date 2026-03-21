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

export class TextToSpeech implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Text To Speech',
		name: 'textToSpeech',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Text to speech model from ElevenLabs',
		defaults: {
			name: 'Wiro - Text To Speech',
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
				required: true,
				description: 'Prompt-help',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: 'eleven_flash_v2',
				required: true,
				description: 'Model-help',
				options: [
					{ name: 'Eleven Flash V2', value: 'eleven_flash_v2' },
					{ name: 'Eleven Flash V2 5', value: 'eleven_flash_v2_5' },
					{ name: 'Eleven Turbo V2', value: 'eleven_turbo_v2' },
					{ name: 'Eleven Turbo V2 5', value: 'eleven_turbo_v2_5' },
					{ name: 'Eleven V3', value: 'eleven_v3' },
				],
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				default: 'ErXwobaYiN019PkySvjV',
				required: true,
				description: 'Select option for voice',
				options: [
					{ name: 'Antoni', value: 'ErXwobaYiN019PkySvjV' },
					{ name: 'Aria', value: '9BWtsMINqrJLrRacOk9x' },
					{ name: 'Callum', value: 'N2lVS1w4EtoT3dr4eOWO' },
					{ name: 'Charlie', value: 'IKne3meq5aSn9XLyUdCD' },
					{ name: 'Clyde', value: '2EiwWnXFnvU5JabPnv8n' },
					{ name: 'Dave', value: 'CYw3kZ02Hs0563khs1Fj' },
					{ name: 'Domi', value: 'AZnzlk1XvdvUeBnXmlld' },
					{ name: 'Drew', value: '29vD33N1CtxCmqQRPOHJ' },
					{ name: 'Elli', value: 'MF3mGyEYCl7XYWbV9V6O' },
					{ name: 'Emily', value: 'LcfcDJNUP1GQjkzn1xUU' },
					{ name: 'Fin', value: 'D38z5RcWu1voky8WS1ja' },
					{ name: 'George', value: 'JBFqnCBsd6RMkjVDRZzb' },
					{ name: 'Laura', value: 'FGY2WhTYpPnrIDTdsKH5' },
					{ name: 'Patrick', value: 'ODq5zmih8GrVes37Dizd' },
					{ name: 'Paul', value: '5Q0t7uMcjvnagumLfvZi' },
					{ name: 'Rachel', value: '21m00Tcm4TlvDq8ikWAM' },
					{ name: 'River', value: 'SAz9YHcvj6GT2YYXdXww' },
					{ name: 'Roger', value: 'CwhRBWXzGAHq8TQ4Fs17' },
					{ name: 'Sarah', value: 'EXAVITQu4vr4xnSDxMaL' },
					{ name: 'Thomas', value: 'GBv7mTt0atIp3Br8iCZE' },
				],
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'mp3_22050_32',
				required: true,
				description: 'Select option for output format',
				options: [
					{ name: 'Mp3 22050 32', value: 'mp3_22050_32' },
					{ name: 'Mp3 44100 128', value: 'mp3_44100_128' },
					{ name: 'Mp3 44100 32', value: 'mp3_44100_32' },
					{ name: 'Mp3 44100 64', value: 'mp3_44100_64' },
					{ name: 'Mp3 44100 96', value: 'mp3_44100_96' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const model = this.getNodeParameter('model', 0) as string;
		const voice = this.getNodeParameter('voice', 0) as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/elevenlabs/text-to-speech',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				model,
				voice,
				outputFormat,
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
