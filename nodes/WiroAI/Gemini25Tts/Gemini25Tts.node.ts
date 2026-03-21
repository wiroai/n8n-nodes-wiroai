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

export class Gemini25Tts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Gemini 2.5 TTS',
		name: 'gemini25Tts',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Google\'s Gemini 2.5 Flash Text To Speech Preview model',
		defaults: {
			name: 'Wiro - Gemini 2.5 TTS',
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
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				default: 'Achernar',
				required: true,
				description: 'Select option for voice',
				options: [
					{ name: 'Achernar Female', value: 'Achernar' },
					{ name: 'Achird Male', value: 'Achird' },
					{ name: 'Algenib Male', value: 'Algenib' },
					{ name: 'Algieba Male', value: 'Algieba' },
					{ name: 'Alnilam Male', value: 'Alnilam' },
					{ name: 'Aoede Female', value: 'Aoede' },
					{ name: 'Autonoe Female', value: 'Autonoe' },
					{ name: 'Callirrhoe Female', value: 'Callirrhoe' },
					{ name: 'Charon Male', value: 'Charon' },
					{ name: 'Despina Female', value: 'Despina' },
					{ name: 'Enceladus Male', value: 'Enceladus' },
					{ name: 'Erinome Female', value: 'Erinome' },
					{ name: 'Fenrir Male', value: 'Fenrir' },
					{ name: 'Gacrux Female', value: 'Gacrux' },
					{ name: 'Iapetus Male', value: 'Iapetus' },
					{ name: 'Kore Female', value: 'Kore' },
					{ name: 'Laomedeia Female', value: 'Laomedeia' },
					{ name: 'Leda Female', value: 'Leda' },
					{ name: 'Orus Male', value: 'Orus' },
					{ name: 'Puck Male', value: 'Puck' },
					{ name: 'Pulcherrima Female', value: 'Pulcherrima' },
					{ name: 'Rasalgethi Male', value: 'Rasalgethi' },
					{ name: 'Sadachbia Male', value: 'Sadachbia' },
					{ name: 'Sadaltager Male', value: 'Sadaltager' },
					{ name: 'Schedar Male', value: 'Schedar' },
					{ name: 'Sulafat Female', value: 'Sulafat' },
					{ name: 'Umbriel Male', value: 'Umbriel' },
					{ name: 'Vindemiatrix Female', value: 'Vindemiatrix' },
					{ name: 'Zephyr Female', value: 'Zephyr' },
					{ name: 'Zubenelgenubi Male', value: 'Zubenelgenubi' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const voice = this.getNodeParameter('voice', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/gemini-2.5-tts',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				voice,
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
