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

export class PImageEdit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Pruna P-Image Edit Image-to-Image API, Pricing and Docs',
		name: 'pImageEdit',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'P-Image-Edit by Pruna-AI is a lightning-fast image-to-image API for instant edits, style transf',
		defaults: {
			name: 'Wiro - Pruna P-Image Edit Image-to-Image API, Pricing and Docs',
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
				displayName: 'Input Images URL',
				name: 'inputImagesUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Accepts up to 5 images',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Text input for prompt',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Select option for aspect ratio',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:3', value: '2:3' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
					{ name: 'Match Input Image', value: 'match_input_image' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed. Leave zero to randomize the seed.',
			},
			{
				displayName: 'Safety Checker',
				name: 'disableSafetyChecker',
				type: 'options',
				default: 'false',
				description: 'Disable safety checker for generated images',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImagesUrl = this.getNodeParameter('inputImagesUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const disableSafetyChecker = this.getNodeParameter('disableSafetyChecker', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/pruna/p-image-edit',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImagesUrl,
				prompt,
				aspectRatio,
				seed,
				disableSafetyChecker,
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
