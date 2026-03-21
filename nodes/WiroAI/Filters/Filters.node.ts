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

export class Filters implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Filters',
		name: 'filters',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'An image-to-image AI model designed to apply unique filters to your images, giving them a fresh',
		defaults: {
			name: 'Wiro - Filters',
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
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Image to use as reference. Must be jpeg, png.',
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'options',
				default: 'Black and White',
				required: true,
				description: 'Select option for filter',
				options: [
					{ name: 'Black And White', value: 'Black and White' },
					{ name: 'Cool', value: 'Cool' },
					{ name: 'Grayscale', value: 'Grayscale' },
					{ name: 'Sepia', value: 'Sepia' },
					{ name: 'Vivid', value: 'Vivid' },
					{ name: 'Warm', value: 'Warm' },
				],
			},
			{
				displayName: 'Safety Tolerance',
				name: 'safetyTolerance',
				type: 'options',
				default: '2',
				description: 'Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.',
				options: [
					{ name: '2', value: '2' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Aspect ratio of the image',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '1:2', value: '1:2' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:1', value: '2:1' },
					{ name: '2:3', value: '2:3' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '4:5', value: '4:5' },
					{ name: '5:4', value: '5:4' },
					{ name: '9:16', value: '9:16' },
					{ name: '9:21', value: '9:21' },
					{ name: 'Match Input Image', value: '' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'jpeg',
				description: 'Output format for the generated image. Can be \'jpeg\' or \'png\'.',
				options: [
					{ name: 'Jpeg', value: 'jpeg' },
					{ name: 'Png', value: 'png' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const filter = this.getNodeParameter('filter', 0) as string;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0, '') as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/filters',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				filter,
				safetyTolerance,
				aspectRatio,
				seed,
				outputFormat,
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
