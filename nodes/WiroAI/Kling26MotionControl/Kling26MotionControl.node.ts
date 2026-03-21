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

export class Kling26MotionControl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kling V2.6 Motion Control',
		name: 'kling26MotionControl',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create high-quality videos with controlled motion using Kling V2.6 Motion Control. Perfect for',
		defaults: {
			name: 'Wiro - Kling V2.6 Motion Control',
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
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'pro',
				required: true,
				description: 'Video generation mode. \'std\': Standard mode (cost-effective). \'pro\': Professional mode (higher quality)',
				options: [
					{ name: 'Pro', value: 'pro' },
					{ name: 'Std', value: 'std' },
				],
			},
			{
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Reference image. The characters, backgrounds, and other elements in the generated video are based on the reference image. Supports .jpg/.jpeg/.png, max 10MB, dimensions 340px-3850px, aspect ratio 1:2.5 to 2.5:1',
			},
			{
				displayName: 'Video URL',
				name: 'inputVideoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Reference video. The character actions in the generated video are consistent with the reference video. Supports .mp4/.mov, max 100MB, 3-30 seconds duration depending on character_orientation',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Text prompt for video generation. You can add elements to the screen and achieve motion effects through prompt words.',
			},
			{
				displayName: 'Keep Original Sound',
				name: 'originalSound',
				type: 'options',
				default: 'no',
				required: true,
				description: 'Whether to keep the original sound of the video',
				options: [
					{ name: 'No', value: 'no' },
					{ name: 'Yes', value: 'yes' },
				],
			},
			{
				displayName: 'Character Orientation',
				name: 'characterOrientation',
				type: 'options',
				default: 'image',
				required: true,
				description: 'Generate the orientation of the characters in the video. \'image\': same orientation as the person in the picture (max 10s video). \'video\': consistent with the orientation of the characters in the video (max 30s video)',
				options: [
					{ name: 'Image', value: 'image' },
					{ name: 'Video', value: 'video' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const mode = this.getNodeParameter('mode', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputVideoUrl = this.getNodeParameter('inputVideoUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const originalSound = this.getNodeParameter('originalSound', 0) as string;
		const characterOrientation = this.getNodeParameter('characterOrientation', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/klingai/kling-v2.6-motion-control',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				mode,
				inputImageUrl,
				inputVideoUrl,
				prompt,
				originalSound,
				characterOrientation,
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
