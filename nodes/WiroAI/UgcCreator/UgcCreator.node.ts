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

export class UgcCreator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - UGC Creator for Product Ads',
		name: 'ugcCreator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create engaging UGC videos for product ads using AI. Perfect for e-commerce and marketing teams',
		defaults: {
			name: 'Wiro - UGC Creator for Product Ads',
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
				displayName: 'Effect Type',
				name: 'effectType',
				type: 'string',
				default: '',
				required: true,
				description: 'Required',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'pro',
				required: true,
				description: 'Required. Std mode is 5 seconds, pro mode is 10 seconds.',
				options: [
					{ name: 'Pro (10 Seconds)', value: 'pro' },
					{ name: 'Std (5 Seconds)', value: 'std' },
				],
			},
			{
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Required: Product photo',
			},
			{
				displayName: 'Script',
				name: 'script',
				type: 'string',
				default: '',
				required: true,
				description: 'Required. Enter your video script. Note: Scripts exceeding the time limit for the selected mode will be cut short. Choose a longer duration mode for extensive scripts',
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'Required. Default 9:16.',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Model Image URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Optional: Model photo',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const effectType = this.getNodeParameter('effectType', 0) as string;
		const mode = this.getNodeParameter('mode', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const script = this.getNodeParameter('script', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/ugc creator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				effectType,
				mode,
				inputImageUrl,
				script,
				ratio,
				inputImage2Url,
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
