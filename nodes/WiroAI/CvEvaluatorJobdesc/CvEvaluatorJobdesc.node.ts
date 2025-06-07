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

export class CvEvaluatorJobdesc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Analyze & Evaluate Resume / CV With Job Description',
		name: 'cvEvaluatorJobdesc',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Scores and analyzes resumes based on job descriptions using AI',
		defaults: {
			name: 'Wiro - Analyze & Evaluate Resume / CV With Job Description',
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
				displayName: 'Enter Documents URL',
				name: 'inputDocumentUrlMultiple',
				type: 'string',
				default: '',
				required: true,
				description:
					'Upload multiple CV files. Supported formats: .csv, .docx, .pdf, .jpg, .png, .pptx, etc.',
			},
			{
				displayName: 'Job Description',
				name: 'jobDesc',
				type: 'string',
				default: '',
				required: true,
				description: 'Paste a job description to evaluate resumes against it',
			},
			{
				displayName: 'Output Type',
				name: 'outputType',
				type: 'options',
				default: 'json',
				options: [
					{ name: 'JSON', value: 'json' },
					{ name: 'CSV', value: 'csv' },
				],
				description: 'Choose the export format for the evaluation results',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const inputDocumentUrlMultiple = this.getNodeParameter('inputDocumentUrlMultiple', 0) as string;
		const jobDesc = this.getNodeParameter('jobDesc', 0) as string;
		const outputType = this.getNodeParameter('outputType', 0) as string;

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Resume-CV-Evaluator-JobDesc',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputDocumentUrlMultiple,
				jobDesc,
				outputType,
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
