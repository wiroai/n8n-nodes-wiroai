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

export class InteriorDesignGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Interior Design Generator',
		name: 'interiorDesignGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description:
			'Redesigns interior spaces using uploaded reference images and descriptive prompts',
		defaults: {
			name: 'Wiro - Interior Design Generator',
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
				displayName: 'Enter Your Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Choose an image that will be used for interior redesign',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: 'Hyper-realistic, contemporary hotel bedroom studio, muted palette',
				required: true,
				description: 'Describe the desired interior style, theme, colors, etc',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: 'blurry, cartoon, disfigured, beginner',
				description: 'Describe what you do NOT want in the output',
			},
			{
				displayName: 'Samples',
				name: 'samples',
				type: 'string',
				default: '2',
				description: 'How many images to generate',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'string',
				default: '25',
				description: 'Number of steps for generation',
			},
			{
				displayName: 'Strength',
				name: 'strength',
				type: 'string',
				default: '0.8',
				description: 'Strength of transformation from original image',
			},
			{
				displayName: 'ControlNet Seg Scale',
				name: 'controlnetSegScale',
				type: 'string',
				default: '0.2',
				description: 'Scale for segmentation guidance',
			},
			{
				displayName: 'ControlNet Mlsd Scale',
				name: 'controlnetMlsdScale',
				type: 'string',
				default: '0.1',
				description: 'Scale for MLSD (line guidance)',
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'string',
				default: '15.0',
				description: 'Classifier-free guidance scale',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '1577619',
				description: 'Seed value for reproducible outputs',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, '') as string;
		const strength = this.getNodeParameter('strength', 0, '') as string;
		const controlnetSegScale = this.getNodeParameter('controlnetSegScale', 0, '') as string;
		const controlnetMlsdScale = this.getNodeParameter('controlnetMlsdScale', 0, '') as string;
		const scale = this.getNodeParameter('scale', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/interior-design',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				negativePrompt,
				samples,
				steps,
				strength,
				controlnetSegScale,
				controlnetMlsdScale,
				scale,
				seed,
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
