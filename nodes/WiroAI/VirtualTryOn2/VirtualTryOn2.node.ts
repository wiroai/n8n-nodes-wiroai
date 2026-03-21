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

export class VirtualTryOn2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Virtual Try-On V2',
		name: 'virtualTryOn2',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Transform flat garments into lifelike models without a physical photoshoot. Integrate Wiro API',
		defaults: {
			name: 'Wiro - Virtual Try-On V2',
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
				displayName: 'Human Image URL',
				name: 'inputImageHumanUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Upload the photo of the person who will model the outfit',
			},
			{
				displayName: 'Garment Images URL',
				name: 'inputImageClothesUrl',
				type: 'string',
				default: '',
				description: 'Upload images of garments and accessories to try on (max. 13).',
			},
			{
				displayName: 'Photography Style',
				name: 'style',
				type: 'options',
				default: 'indoor',
				description: 'Choose the photography style and environment for the output image',
				options: [
					{ name: 'Indoor Lifestyle', value: 'indoor' },
					{ name: 'Outdoor Location', value: 'outdoor' },
					{ name: 'Studio Photography', value: 'studio' },
					{ name: 'Virtual Try On (Keep Original Scene)', value: 'virtual-try-on' },
				],
			},
			{
				displayName: 'Posture',
				name: 'pose',
				type: 'options',
				default: 'auto',
				description: 'Choose the body posture for the model',
				options: [
					{ name: 'Auto (Best For Garment)', value: 'auto' },
					{ name: 'Side Profile', value: 'side-profile' },
					{ name: 'Sitting', value: 'sitting' },
					{ name: 'Standing', value: 'standing' },
				],
			},
			{
				displayName: 'Shot Type',
				name: 'plan',
				type: 'options',
				default: 'auto',
				description: 'Choose the framing/composition type. Note: Headshot ignores footwear, Medium Shot ignores lower body items.',
				options: [
					{ name: 'Auto (Best For Garment)', value: 'auto' },
					{ name: 'Headshot (Shoulders Up)', value: 'headshot' },
					{ name: 'Medium Shot (Waist Up)', value: 'medium-shot' },
					{ name: 'Wide Shot (Full Body)', value: 'wide-shot' },
				],
			},
			{
				displayName: 'Ratio',
				name: 'ratio',
				type: 'options',
				default: '1:1',
				description: 'Optional. Ratio of the image/video.',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
					{ name: 'Auto', value: 'auto' },
				],
			},
			{
				displayName: 'Output Type',
				name: 'outputType',
				type: 'options',
				default: 'image',
				description: 'Select option for output type',
				options: [
					{ name: 'Image', value: 'image' },
					{ name: 'Image & Video', value: 'both' },
					{ name: 'Video', value: 'video' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageHumanUrl = this.getNodeParameter('inputImageHumanUrl', 0) as string;
		const inputImageClothesUrl = this.getNodeParameter('inputImageClothesUrl', 0, '') as string;
		const style = this.getNodeParameter('style', 0, '') as string;
		const pose = this.getNodeParameter('pose', 0, '') as string;
		const plan = this.getNodeParameter('plan', 0, '') as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const outputType = this.getNodeParameter('outputType', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Virtual Try-On-V2',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageHumanUrl,
				inputImageClothesUrl,
				style,
				pose,
				plan,
				ratio,
				outputType,
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
