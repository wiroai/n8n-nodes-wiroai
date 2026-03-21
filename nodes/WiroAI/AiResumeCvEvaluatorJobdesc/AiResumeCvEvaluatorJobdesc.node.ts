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

export class AiResumeCvEvaluatorJobdesc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - AI CV/Resume Evaluator',
		name: 'aiResumeCvEvaluatorJobdesc',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Wiro/AI-Resume-CV-Evaluator-JobDesc helps you evaluate and score resumes (CVs) based on job des',
		defaults: {
			name: 'Wiro - AI CV/Resume Evaluator',
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
				displayName: 'Job Desc',
				name: 'jobDesc',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter the details of the job posting, including job title, responsibilities, qualifications, and any additional information relevant to the position. Ensure the description is clear and concise to attract the right candidates.',
			},
			{
				displayName: 'Detail Type',
				name: 'detailType',
				type: 'options',
				default: 'default',
				description: 'Choose between detailed analysis with parsing or a faster evaluation that provides only the score',
				options: [
					{ name: 'Default (Eval Score & Parse)', value: 'default' },
					{ name: 'Fast (Eval Score)', value: 'fast' },
				],
			},
			{
				displayName: 'Output Type',
				name: 'outputType',
				type: 'options',
				default: 'csv',
				description: 'Choose the preferred file format for exporting your data. Select JSON for structured, CSV for a tabular format suitable for spreadsheets and databases.',
				options: [
					{ name: 'Csv', value: 'csv' },
					{ name: 'Json', value: 'json' },
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
		const jobDesc = this.getNodeParameter('jobDesc', 0) as string;
		const detailType = this.getNodeParameter('detailType', 0, '') as string;
		const outputType = this.getNodeParameter('outputType', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Resume-CV-Evaluator-JobDesc',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputDocumentMultiple: inputDocumentMultipleUrl,
				inputDocumentUrlMultiple,
				jobDesc,
				detailType,
				outputType,
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
