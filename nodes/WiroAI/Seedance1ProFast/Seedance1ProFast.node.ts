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

export class Seedance1ProFast implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Seedance V1 Pro Fast - Video Generator',
		name: 'seedance1ProFast',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create stunning videos with Seedance V1 Pro Fast AI. Transform text or images into high-quality',
		defaults: {
			name: 'Wiro - Seedance V1 Pro Fast - Video Generator',
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
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Required if there is no prompt',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Optional for i2v, required for t2v. The prompt to generate the video.',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Required. Video resolution.',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				required: true,
				description: 'Required. Generate video aspect ratio. Adaptive is available for image to video only, if you send adaptive without image it will be set to 16:9 by default',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
					{ name: 'Adaptive', value: 'adaptive' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '10',
				required: true,
				description: 'Required. Generated video duration in seconds.',
				options: [
					{ name: '10', value: '10' },
					{ name: '5', value: '5' },
				],
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				description: 'Optional. Default false. Generate whether the video contains a watermark',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Optional. Default random. Seed integer to control the randomness of generated content. Set 0 to random',
			},
			{
				displayName: 'Fix Camera',
				name: 'cameraFixed',
				type: 'options',
				default: 'false',
				description: 'Optional. Default false. Whether to fix the camera position',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const ratio = this.getNodeParameter('ratio', 0) as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const watermark = this.getNodeParameter('watermark', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const cameraFixed = this.getNodeParameter('cameraFixed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/seedance-v1-pro-fast',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				resolution,
				ratio,
				duration,
				watermark,
				seed,
				cameraFixed,
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
