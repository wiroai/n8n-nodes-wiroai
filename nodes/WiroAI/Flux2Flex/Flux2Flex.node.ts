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

export class Flux2Flex implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Flux 2 Flex',
		name: 'flux2Flex',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Optimize latency and detail with Flux 2 Flex. An API that lets developers tune parameter steps',
		defaults: {
			name: 'Wiro - Flux 2 Flex',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'It accepts up to 8 images',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Text prompt for image generation',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width in pixels (must be multiple of 16). Set it to 0 or do not send if you want to match input image. Flux accepts between 64 and 2048',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height in pixels (must be multiple of 16). Set it to 0 or do not send if you want to match input image. Flux accepts between 64 and 2048',
			},
			{
				displayName: 'Safety Tolerance',
				name: 'safetyTolerance',
				type: 'number',
				default: 0,
				description: 'Tolerance level for input and output moderation. Between 0 and 5, 0 being most strict, 5 being least strict.',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Seed for reproducible results. Use the same seed to get consistent outputs.',
			},
			{
				displayName: 'Guidance',
				name: 'guidance',
				type: 'number',
				default: 0,
				description: 'Guidance scale. Controls how closely the output follows the prompt. Minimum: 1.5, maximum: 10, default: 4.5. Higher = closer prompt adherence',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Number of inference steps. Maximum: 50, default: 50. Higher = more detail, slower',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'jpeg',
				description: 'Output format for the generated image',
				options: [
					{ name: 'JPEG', value: 'jpeg' },
					{ name: 'PNG', value: 'png' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const guidance = this.getNodeParameter('guidance', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/black-forest-labs/flux-2-flex',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				width,
				height,
				safetyTolerance,
				seed,
				guidance,
				steps,
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
