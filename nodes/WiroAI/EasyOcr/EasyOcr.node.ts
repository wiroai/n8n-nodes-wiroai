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

export class EasyOcr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Extract Text From Image',
		name: 'easyOcr',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Extracts text from images using AI',
		defaults: {
			name: 'Wiro - Extract Text From Image',
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
				displayName: 'Enter Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter an image URL to extract text from',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'English',
				required: true,
				options: [
					{ name: 'Arabic', value: 'Arabic' },
					{ name: 'Chinese', value: 'Chinese' },
					{ name: 'Czech', value: 'Czech' },
					{ name: 'Dutch', value: 'Dutch' },
					{ name: 'English', value: 'English' },
					{ name: 'French', value: 'French' },
					{ name: 'German', value: 'German' },
					{ name: 'Hindi', value: 'Hindi' },
					{ name: 'Hungarian', value: 'Hungarian' },
					{ name: 'Italian', value: 'Italian' },
					{ name: 'Japanese', value: 'Japanese' },
					{ name: 'Korean', value: 'Korean' },
					{ name: 'Polish', value: 'Polish' },
					{ name: 'Portuguese', value: 'Portuguese' },
					{ name: 'Russian', value: 'Russian' },
					{ name: 'Spanish', value: 'Spanish' },
					{ name: 'Turkish', value: 'Turkish' },
				],
				description: 'Select the language used in the image text',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const language = this.getNodeParameter('language', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/easy_ocr',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
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
