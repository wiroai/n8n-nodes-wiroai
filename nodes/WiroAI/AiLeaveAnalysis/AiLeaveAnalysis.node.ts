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

export class AiLeaveAnalysis implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ai Leave Analysis',
		name: 'aiLeaveAnalysis',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Wiro/AI-Leave-Analysis enables you to analyze and evaluate employee leave patterns and data usi',
		defaults: {
			name: 'Wiro - Ai Leave Analysis',
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
				displayName: 'Input Document Multiple URLs',
				name: 'inputDocumentMultipleUrl',
				type: 'string',
				default: '',
				description: 'Upload your employee\'s leave data. Ensure the files are relevant and properly formatted for accurate processing. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
			},
			{
				displayName: 'Input Document Url Multiple',
				name: 'inputDocumentUrlMultiple',
				type: 'string',
				default: '',
				description: 'Enter multiple file URLs separated by comma ( , ). Ensure the URLs are accessible and correctly formatted. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
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

		const inputDocumentMultipleUrl = this.getNodeParameter('inputDocumentMultipleUrl', 0, '') as string;
		const inputDocumentUrlMultiple = this.getNodeParameter('inputDocumentUrlMultiple', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Leave-Analysis',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputDocumentMultiple: inputDocumentMultipleUrl,
				inputDocumentUrlMultiple,
				language,
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
