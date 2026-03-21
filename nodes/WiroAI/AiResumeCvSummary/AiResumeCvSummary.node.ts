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

export class AiResumeCvSummary implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ai Resume Cv Summary',
		name: 'aiResumeCvSummary',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Summarize resumes instantly with our AI-powered CV Summary Tool. Generate concise, job-relevant',
		defaults: {
			name: 'Wiro - Ai Resume Cv Summary',
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
				description: 'Upload multiple CV files. Ensure the files are relevant and properly formatted for accurate processing. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
			},
			{
				displayName: 'Input Document Url Multiple',
				name: 'inputDocumentUrlMultiple',
				type: 'string',
				default: '',
				description: 'Enter multiple file URLs separated by comma ( , ). Ensure the URLs are accessible and correctly formatted. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
			},
			{
				displayName: 'Summary Type',
				name: 'summaryType',
				type: 'options',
				default: 'long',
				description: 'Choose the summary length: short for key highlights, medium for balanced detail, or long for a comprehensive overview',
				options: [
					{ name: 'Long', value: 'long' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Short', value: 'short' },
				],
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'en',
				description: 'Please select the preferred language for the generated summary',
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
		const summaryType = this.getNodeParameter('summaryType', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Resume-CV-Summary',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputDocumentMultiple: inputDocumentMultipleUrl,
				inputDocumentUrlMultiple,
				summaryType,
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
