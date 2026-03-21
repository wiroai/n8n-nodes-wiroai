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

export class Effects implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Effects',
		name: 'effects',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'PixVerse effects with image-to-video model v4.5',
		defaults: {
			name: 'Wiro - Effects',
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
				description: 'First frame of the video',
			},
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'options',
				default: '313649491716544',
				required: true,
				description: 'Effect',
				options: [
					{ name: 'The Tiger\'s Touch', value: '313649491716544' },
					{ name: 'Zombie Mode', value: '302325299651648' },
				],
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '5',
				required: true,
				description: 'V3.5 only allows 5,8. 1080p does not support 8s.',
				options: [
					{ name: '5', value: '5' },
					{ name: '8', value: '8' },
				],
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Quality of the video',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '360p(Turbo)', value: '360p' },
					{ name: '540p', value: '540p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Motion Mode',
				name: 'motionMode',
				type: 'options',
				default: 'fast',
				description: 'Fast only available when duration is 5. 1080p does not support fast.',
				options: [
					{ name: 'Fast', value: 'fast' },
					{ name: 'Normal', value: 'normal' },
				],
			},
			{
				displayName: 'Style',
				name: 'style',
				type: 'options',
				default: '3d_animation',
				description: 'Effective when model is v3.5. You can leave style empty.',
				options: [
					{ name: '3d Animation', value: '3d_animation' },
					{ name: 'Anime', value: 'anime' },
					{ name: 'Clay', value: 'clay' },
					{ name: 'Comic', value: 'comic' },
					{ name: 'Cyberpunk', value: 'cyberpunk' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Leave null to randomize',
			},
			{
				displayName: 'Watermark',
				name: 'Watermark',
				type: 'options',
				default: 'false',
				description: 'Select option for watermark',
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
		const templateId = this.getNodeParameter('templateId', 0) as string;
		const duration = this.getNodeParameter('duration', 0) as string;
		const quality = this.getNodeParameter('quality', 0) as string;
		const motionMode = this.getNodeParameter('motionMode', 0, '') as string;
		const style = this.getNodeParameter('style', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const Watermark = this.getNodeParameter('Watermark', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/PixVerse/Effects',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				templateId,
				duration,
				quality,
				motionMode,
				style,
				seed,
				Watermark,
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
