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

export class StoreImageGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Store Image Generator',
		name: 'storeImageGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Store Image Generator',
		defaults: {
			name: 'Wiro - Store Image Generator',
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
				displayName: 'Screenshots URL',
				name: 'inputImagesUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'The generation process requires a minimum input of 3 images. Input sets containing fewer than 3 images will trigger an error, and any inputs beyond the fourth image will be disregarded.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				required: true,
				description: 'Provide a description or context for the image generation',
			},
			{
				displayName: 'Store',
				name: 'store',
				type: 'options',
				default: 'apple',
				required: true,
				description: 'Select the store for your app screenshots',
				options: [
					{ name: 'Apple App Store', value: 'apple' },
					{ name: 'Google Play Store', value: 'google' },
				],
			},
			{
				displayName: 'Background Color',
				name: 'color',
				type: 'options',
				default: '',
				description: 'Background color of the images. Auto by default.',
				options: [
					{ name: 'Auto', value: '' },
					{ name: 'Black And Blue Gradient', value: '#000000,#0047aa' },
					{ name: 'Black And Red Gradient', value: '#000000,#e60026' },
					{ name: 'Black And White Gradient', value: '#000000,#FFFFFF' },
					{ name: 'Black Gradient', value: '#18181D,#000000' },
					{ name: 'Blue Gradient', value: '#4582c0,#0047ab' },
					{ name: 'Blue Purple Gradients', value: '#4582c0,#6e3b88' },
					{ name: 'Blue White Gradients', value: '#4582c0,#FFFFFF' },
					{ name: 'Blue Yellow Gradient', value: '#4582c0,#fdb300' },
					{ name: 'Brown Gradient', value: '#A17530,#703F00' },
					{ name: 'Christmas', value: '#028553,#e60026' },
					{ name: 'Cyan Gradient', value: '#19ccb1,#72c9ef' },
					{ name: 'Dark Gradient', value: '#18181D,#332642' },
					{ name: 'Dark Green Gradient', value: '#212e20,#028553' },
					{ name: 'Dark Purple Gradient', value: '#332642,#6e3b88' },
					{ name: 'Gold Gradient', value: '#fdb300,#bb972b' },
					{ name: 'Gray Gradient', value: '#A5ACAF,#5C5C5C' },
					{ name: 'Green Blue Gradient', value: '#7ecaab,#4582c0' },
					{ name: 'Green Gradient', value: '#7ecaab,#028553' },
					{ name: 'Lavender Gradient', value: '#edd5fd,#c9a7c7' },
					{ name: 'Light Blue Gradients', value: '#A6E1F9,#4BC7CE' },
					{ name: 'Light Green Gradient', value: '#b1d41d,#7ecaab' },
					{ name: 'Light Pink Gradient', value: '#f6bcd2,#fcc9bc' },
					{ name: 'Light Purple Gradients', value: '#c9a7c7,#BDC4E3' },
					{ name: 'Maroon Gradient', value: '#660000,#94373e' },
					{ name: 'Metal Gradient', value: '#acadb1,#5C5C5C' },
					{ name: 'Natural Gradient', value: '#8cb14d,#6b564a' },
					{ name: 'Navy Blue', value: '#012e5d,#4582c0' },
					{ name: 'Ocean Gradient', value: '#2d8a7f,#72c9ef' },
					{ name: 'Orange Gradient', value: '#ff9c40,#df8d04' },
					{ name: 'Pastel Gradient', value: '#f6bcd2,#cbfff8' },
					{ name: 'Pink Blue Gradient', value: '#fa9bcb,#4582c0' },
					{ name: 'Pink Gradient', value: '#fa9bcb,#E46FB1' },
					{ name: 'Pink Purple Gradient', value: '#fa9bcb,#6e3b88' },
					{ name: 'Purple Gradient', value: '#a684a7,#550f75' },
					{ name: 'Rainbow Gradient', value: '#e60026,#4582c0' },
					{ name: 'Red And White Gradient', value: '#e60026,#FFFFFF' },
					{ name: 'Red Gradient', value: '#e60026,#a70104' },
					{ name: 'Red Orange', value: '#e60026,#ff9c40' },
					{ name: 'Silver Gradient', value: '#c4a8ff,#acadb1' },
					{ name: 'Skin Color Gradient', value: '#ffdaab,#8f5624' },
					{ name: 'Sky Gradients', value: '#72c9ef,#DCEFF4' },
					{ name: 'Sunset Gradient', value: '#ff9c40,#a70104' },
					{ name: 'Teal Gradient', value: '#19ccb1,#0a6400' },
					{ name: 'Violet Gradient', value: '#a179a5,#6e3b88' },
					{ name: 'White Gradient', value: '#FFFFFF,#F5F2E8' },
					{ name: 'Yellow Gradient', value: '#FFDA8F,#fdb300' },
					{ name: 'Yellow Red', value: '#fdb300,#e60026' },
				],
			},
			{
				displayName: 'Font',
				name: 'font',
				type: 'options',
				default: 'Arimo',
				required: true,
				description: 'Select option for font',
				options: [
					{ name: 'Arimo', value: 'Arimo' },
					{ name: 'Inter', value: 'Inter' },
					{ name: 'Lato', value: 'Lato' },
					{ name: 'Montserrat', value: 'Montserrat' },
					{ name: 'Noto Sans', value: 'Noto Sans' },
					{ name: 'Nunito', value: 'Nunito' },
					{ name: 'Nunito Sans', value: 'Nunito Sans' },
					{ name: 'Open Sans', value: 'Open Sans' },
					{ name: 'Oswald', value: 'Oswald' },
					{ name: 'Playfair Display', value: 'Playfair Display' },
					{ name: 'Poppins', value: 'Poppins' },
					{ name: 'Raleway', value: 'Raleway' },
					{ name: 'Roboto', value: 'Roboto' },
					{ name: 'Roboto Condensed', value: 'Roboto Condensed' },
					{ name: 'Roboto Mono', value: 'Roboto Mono' },
					{ name: 'Roboto Slab', value: 'Roboto Slab' },
					{ name: 'Rubik', value: 'Rubik' },
					{ name: 'Ubuntu', value: 'Ubuntu' },
				],
			},
			{
				displayName: 'Font Color',
				name: 'fontColor',
				type: 'color',
				default: '',
				description: 'Please enter a hex colour code',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImagesUrl = this.getNodeParameter('inputImagesUrl', 0) as string;
		const description = this.getNodeParameter('description', 0) as string;
		const store = this.getNodeParameter('store', 0) as string;
		const color = this.getNodeParameter('color', 0, '') as string;
		const font = this.getNodeParameter('font', 0) as string;
		const fontColor = this.getNodeParameter('fontColor', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Store Image Generator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImagesUrl,
				description,
				store,
				color,
				font,
				fontColor,
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
