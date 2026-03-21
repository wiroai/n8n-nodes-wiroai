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

export class ImageToImageSeededit3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Image To Image Seededit V3',
		name: 'imageToImageSeededit3',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'An image-to-image model for editing images using ByteDance\'s seededit v3 model',
		defaults: {
			name: 'Wiro - Image To Image Seededit V3',
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
				description: 'An input image must meet the following requirements: Image format: jpeg, png. Aspect ratio (width/height): within the range (1/3, 3). Width and height (px) > 14. Size: no more than 10MB',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Text description, a prompt word used to edit images',
			},
			{
				displayName: 'Guidancescale',
				name: 'guidanceScale',
				type: 'number',
				default: 0,
				description: 'The degree of influence of text descriptions and input images on generated images. Value range: floating-point numbers between [1, 10]. The larger the value, the greater the influence of text descriptions and the smaller the influence of input images',
			},
			{
				displayName: 'Watermark',
				name: 'watermark',
				type: 'options',
				default: 'false',
				description: 'Whether to add a watermark to the generated picture, false: does not add watermarks true: add a watermark with the text \'AI-generated\' at the bottom right corner of the picture',
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
				required: true,
				description: 'Seed integer to control the randomness of generated content. Set 0 to random.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const guidanceScale = this.getNodeParameter('guidanceScale', 0, 0) as number;
		const watermark = this.getNodeParameter('watermark', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/ByteDance/image-to-image-seededit-v3',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				prompt,
				guidanceScale,
				watermark,
				seed,
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
