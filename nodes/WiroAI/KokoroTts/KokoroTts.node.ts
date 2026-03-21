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

export class KokoroTts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kokoro Tts',
		name: 'kokoroTts',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Kokoro is a high-speed text-to-speech model that delivers clean, accurate, and natural-sounding',
		defaults: {
			name: 'Wiro - Kokoro Tts',
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
				description: 'The prompt to generate audio from',
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				default: 'am_adam',
				required: true,
				description: 'Select option for voice',
				options: [
					{ name: 'Adam', value: 'am_adam' },
					{ name: 'Alex', value: 'em_alex' },
					{ name: 'Alice', value: 'bf_alice' },
					{ name: 'Alloy', value: 'af_alloy' },
					{ name: 'Alpha', value: 'hf_alpha' },
					{ name: 'Aoede', value: 'af_aoede' },
					{ name: 'Bella', value: 'af_bella' },
					{ name: 'Beta', value: 'hf_beta' },
					{ name: 'Daniel', value: 'bm_daniel' },
					{ name: 'Dora', value: 'ef_dora' },
					{ name: 'Echo', value: 'am_echo' },
					{ name: 'Emma', value: 'bf_emma' },
					{ name: 'Eric', value: 'am_eric' },
					{ name: 'Fable', value: 'bm_fable' },
					{ name: 'Fenrir', value: 'am_fenrir' },
					{ name: 'George', value: 'bm_george' },
					{ name: 'Gongitsune', value: 'jf_gongitsune' },
					{ name: 'Heart', value: 'af_heart' },
					{ name: 'Isabella', value: 'bf_isabella' },
					{ name: 'Jessica', value: 'af_jessica' },
					{ name: 'Kore', value: 'af_kore' },
					{ name: 'Kumo', value: 'jm_kumo' },
					{ name: 'Lewis', value: 'bm_lewis' },
					{ name: 'Liam', value: 'am_liam' },
					{ name: 'Lily', value: 'bf_lily' },
					{ name: 'Michael', value: 'am_michael' },
					{ name: 'Nezumi', value: 'jf_nezumi' },
					{ name: 'Nicola', value: 'im_nicola' },
					{ name: 'Nicole', value: 'af_nicole' },
					{ name: 'Nova', value: 'af_nova' },
					{ name: 'Omega', value: 'hm_omega' },
					{ name: 'Onyx', value: 'am_onyx' },
					{ name: 'Psi', value: 'hm_psi' },
					{ name: 'Puck', value: 'am_puck' },
					{ name: 'River', value: 'af_river' },
					{ name: 'Santa', value: 'am_santa' },
					{ name: 'Sara', value: 'if_sara' },
					{ name: 'Sarah', value: 'af_sarah' },
					{ name: 'Siwis', value: 'ff_siwis' },
					{ name: 'Sky', value: 'af_sky' },
					{ name: 'Tebukuro', value: 'jf_tebukuro' },
					{ name: 'Xiaobei', value: 'zf_xiaobei' },
					{ name: 'Xiaoni', value: 'zf_xiaoni' },
					{ name: 'Xiaoxiao', value: 'zf_xiaoxiao' },
					{ name: 'Xiaoyi', value: 'zf_xiaoyi' },
					{ name: 'Yunjian', value: 'zm_yunjian' },
					{ name: 'Yunxi', value: 'zm_yunxi' },
					{ name: 'Yunxia', value: 'zm_yunxia' },
					{ name: 'Yunyang', value: 'zm_yunyang' },
				],
			},
			{
				displayName: 'Lang Code',
				name: 'langCode',
				type: 'options',
				default: 'a',
				required: true,
				description: 'Select option for lang code',
				options: [
					{ name: 'American English', value: 'a' },
					{ name: 'Brazilian Portuguese', value: 'p' },
					{ name: 'British English', value: 'b' },
					{ name: 'French', value: 'f' },
					{ name: 'Hindi', value: 'h' },
					{ name: 'Italian', value: 'i' },
					{ name: 'Spanish', value: 'e' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const voice = this.getNodeParameter('voice', 0) as string;
		const langCode = this.getNodeParameter('langCode', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
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
