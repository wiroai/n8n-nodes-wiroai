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

export class RealEsrgan implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Face Enhancement',
		name: 'realEsrgan',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Real-ESRGAN aims at developing Practical Algorithms for General Image Restoration',
		defaults: {
			name: 'Wiro - Face Enhancement',
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
				description: 'Input-image-help',
			},
			{
				displayName: 'Model Name',
				name: 'modelName',
				type: 'options',
				default: 'realesr-general-wdn-x4v3',
				required: true,
				description: 'Model-name-help',
				options: [
					{ name: 'Realesr General Wdn X4v3', value: 'realesr-general-wdn-x4v3' },
					{ name: 'RealESRGAN X2plus', value: 'RealESRGAN_x2plus' },
					{ name: 'RealESRGAN X4plus', value: 'RealESRGAN_x4plus' },
					{ name: 'RealESRNet X4plus', value: 'RealESRNet_x4plus' },
				],
			},
			{
				displayName: 'Outscale',
				name: 'outscale',
				type: 'number',
				default: 0,
				description: 'Outscale-help',
			},
			{
				displayName: 'Face Enhance',
				name: 'faceEnhance',
				type: 'boolean',
				default: false,
				description: 'Whether to enable face-enhance-help',
			},
			{
				displayName: 'Tile',
				name: 'tile',
				type: 'number',
				default: 0,
				description: 'Tile-help',
			},
			{
				displayName: 'Tile Pad',
				name: 'tilePad',
				type: 'number',
				default: 0,
				description: 'Tile-pad-help',
			},
			{
				displayName: 'Pre Pad',
				name: 'prePad',
				type: 'number',
				default: 0,
				description: 'Pre-pad-help',
			},
			{
				displayName: 'Denoise Strength',
				name: 'denoiseStrength',
				type: 'number',
				default: 0,
				description: 'Denoise-strength-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const modelName = this.getNodeParameter('modelName', 0) as string;
		const outscale = this.getNodeParameter('outscale', 0, 0) as number;
		const faceEnhance = this.getNodeParameter('faceEnhance', 0, false) as boolean;
		const tile = this.getNodeParameter('tile', 0, 0) as number;
		const tilePad = this.getNodeParameter('tilePad', 0, 0) as number;
		const prePad = this.getNodeParameter('prePad', 0, 0) as number;
		const denoiseStrength = this.getNodeParameter('denoiseStrength', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/xinntao/Real-ESRGAN',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				modelName,
				outscale,
				faceEnhance,
				tile,
				tilePad,
				prePad,
				denoiseStrength,
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
