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

export class CameraAngleEditor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Camera Angle Editor',
		name: 'cameraAngleEditor',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Wiro/camera-angle-editor is an advanced AI tool that instantly changes the camera perspective a',
		defaults: {
			name: 'Wiro - Camera Angle Editor',
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
				required: true,
				description: 'URL of the file for image URL',
			},
			{
				displayName: 'Camera Angle',
				name: 'angle',
				type: 'options',
				default: 'back',
				description: 'Choose the camera angle for the product photoshoot. Default is front view.',
				options: [
					{ name: 'Back View', value: 'back' },
					{ name: 'Bottom View', value: 'bottom' },
					{ name: 'Diagonal Dynamic Angle', value: 'diagonal' },
					{ name: 'Eye Level Perspective', value: 'eye-level' },
					{ name: 'Front View', value: 'front' },
					{ name: 'High Angle View', value: 'high-angle' },
					{ name: 'Isometric View (30°)', value: 'isometric' },
					{ name: 'Left Side View', value: 'left-side' },
					{ name: 'Low Angle View', value: 'low-angle' },
					{ name: 'Right Side View', value: 'right-side' },
					{ name: 'Three Quarter Angle (45°)', value: 'three-quarter' },
					{ name: 'Top Down View', value: 'top-down' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const angle = this.getNodeParameter('angle', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/camera-angle-editor',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				angle,
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
