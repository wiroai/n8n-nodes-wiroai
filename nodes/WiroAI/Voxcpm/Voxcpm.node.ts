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

export class Voxcpm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Voxcpm',
		name: 'voxcpm',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Tokenizer-Free TTS for Context-Aware Speech Generation and True-to-Life Voice Cloning',
		defaults: {
			name: 'Wiro - Voxcpm',
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
				description: 'Input Audio and Reference Audio Text must both be provided or both be None',
			},
			{
				displayName: 'Reference Audio Text',
				name: 'referencePrompt',
				type: 'string',
				default: '',
				description: 'Input Audio and Reference Audio Text must both be provided or both be None',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Prompt-help',
			},
			{
				displayName: 'Cfg Value',
				name: 'cfgValue',
				type: 'number',
				default: 0,
				required: true,
				description: 'LM guidance on LocDiT, higher for better adherence to the prompt, but maybe worse',
			},
			{
				displayName: 'Inference Steps',
				name: 'inferenceSteps',
				type: 'number',
				default: 0,
				description: 'LocDiT inference timesteps, higher for better result, lower for fast speed',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const referencePrompt = this.getNodeParameter('referencePrompt', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const cfgValue = this.getNodeParameter('cfgValue', 0) as number;
		const inferenceSteps = this.getNodeParameter('inferenceSteps', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/openbmb/VoxCPM',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputAudioUrl,
				referencePrompt,
				prompt,
				cfgValue,
				inferenceSteps,
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
