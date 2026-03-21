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

export class AiExitInterviewGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ai Exit Interview Generator',
		name: 'aiExitInterviewGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Wiro/AI-Exit-Interview-Generator enables you to generate personalized exit interviews based on',
		defaults: {
			name: 'Wiro - Ai Exit Interview Generator',
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
				displayName: 'Employee Info',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter the information of the employee which leaves the company',
			},
			{
				displayName: 'Interview Type',
				name: 'interviewType',
				type: 'options',
				default: 'live',
				description: 'Choose between live or form type based on your needs',
				options: [
					{ name: 'Generate Questions As A Live Script', value: 'live' },
					{ name: 'Generates Questiones As A Form', value: 'form' },
				],
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'en',
				description: 'Choose the preferred language',
				options: [
					{ name: 'EN', value: 'en' },
					{ name: 'TR', value: 'tr' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const interviewType = this.getNodeParameter('interviewType', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Exit-Interview-Generator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				interviewType,
				language,
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
