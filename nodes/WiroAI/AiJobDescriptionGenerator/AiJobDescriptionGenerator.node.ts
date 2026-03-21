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

export class AiJobDescriptionGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Job Description Generator',
		name: 'aiJobDescriptionGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Wiro/AI-Job-Description-Generator helps you create tailored job descriptions based on detailed',
		defaults: {
			name: 'Wiro - Job Description Generator',
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
				displayName: 'Job Detail',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter the details of the job posting, including job title, responsibilities, qualifications, and any additional information relevant to the position. Ensure the description is clear and concise to attract the right candidates.',
			},
			{
				displayName: 'Tone',
				name: 'tone',
				type: 'options',
				default: 'Conversational',
				description: 'Please select the preferred tone for the generated job description',
				options: [
					{ name: 'Conversational', value: 'Conversational' },
					{ name: 'Creative', value: 'Creative' },
					{ name: 'Enthusiastic', value: 'Enthusiastic' },
					{ name: 'Formal', value: 'Formal' },
					{ name: 'Minimalist And Professional', value: 'Minimalist and Professional' },
				],
			},
			{
				displayName: 'Input Document Multiple (Optional) URLs',
				name: 'inputDocumentMultipleUrl',
				type: 'string',
				default: '',
				description: 'Upload one or more supporting files such as CVs or documents to enrich the job listing. Can upload multiple files for additional information. Ensure the files are relevant and properly formatted for accurate processing. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
			},
			{
				displayName: 'Input Document Url Multiple (Optional)',
				name: 'inputDocumentUrlMultiple',
				type: 'string',
				default: '',
				description: 'Upload one or more supporting files such as CVs or documents to enrich the job listing. Enter multiple file URLs separated by comma ( , ). Ensure the URLs are accessible and correctly formatted. Supported file types: .csv, .docx, .epub, .jpeg, .jpg, .mbox, .md, .mp3, .mp4, .pdf, .png, .ppt, .pptm, .pptx',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'en',
				description: 'Please select the preferred language for the generated job description',
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
		const tone = this.getNodeParameter('tone', 0, '') as string;
		const inputDocumentMultipleUrl = this.getNodeParameter('inputDocumentMultipleUrl', 0, '') as string;
		const inputDocumentUrlMultiple = this.getNodeParameter('inputDocumentUrlMultiple', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/AI-Job-Description-Generator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				tone,
				inputDocumentMultiple: inputDocumentMultipleUrl,
				inputDocumentUrlMultiple,
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
