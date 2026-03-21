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

export class FaceSwap implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Face Swap',
		name: 'faceSwap',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Industry leading face manipulation',
		defaults: {
			name: 'Wiro - Face Swap',
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
				displayName: 'The Face Image With Which The Scene Is Generated Or Swap. URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Used for: -Single Swap -Single Generation Swap -Multi Swap -Multi Generation Swap -Specific (left or right) Swap',
			},
			{
				displayName: 'Second Users Face Image (Optional) URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Used for: -Multi Swap -Multi Generation Swap',
			},
			{
				displayName: 'Background Image (Optional) URL',
				name: 'inputImage3Url',
				type: 'string',
				default: '',
				description: 'Used for: -Multi Swap -Single Swap -Specific (left or right) Swap',
			},
			{
				displayName: 'Swap Position (Optional)',
				name: 'swapPosition',
				type: 'options',
				default: 'left',
				description: 'Used for: -Specific (left or right) Swap',
				options: [
					{ name: 'Left', value: 'left' },
					{ name: 'None', value: 'None' },
					{ name: 'Right', value: 'right' },
				],
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Used for: -Single Generation Swap -Multi Generation Swap',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width-help',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height-help',
			},
			{
				displayName: 'Output Style',
				name: 'outputStyle',
				type: 'options',
				default: '90sTV',
				description: 'Swap-position-help',
				options: [
					{ name: '90sTV', value: '90sTV' },
					{ name: 'ChromeStudio', value: 'chromeStudio' },
					{ name: 'Cinematic', value: 'cinematic' },
					{ name: 'CinematicDark', value: 'cinematicDark' },
					{ name: 'ColorGelLighting', value: 'colorGelLighting' },
					{ name: 'Cyberpunk', value: 'cyberpunk' },
					{ name: 'DesertFuturism', value: 'desertFuturism' },
					{ name: 'DslrStudioPortrait', value: 'dslrStudioPortrait' },
					{ name: 'EditorialSplash', value: 'editorialSplash' },
					{ name: 'FlatColorBackdrop', value: 'flatColorBackdrop' },
					{ name: 'Glamour', value: 'glamour' },
					{ name: 'GradientNeonBackdrop', value: 'gradientNeonBackdrop' },
					{ name: 'HologramBackdrop', value: 'hologramBackdrop' },
					{ name: 'HyperRealistic', value: 'hyperRealistic' },
					{ name: 'MinimalBeigeStudio', value: 'minimalBeigeStudio' },
					{ name: 'MonochromeScene', value: 'monochromeScene' },
					{ name: 'NatureContrast', value: 'natureContrast' },
					{ name: 'Neonpunk', value: 'neonpunk' },
					{ name: 'None', value: 'None' },
					{ name: 'PaperCutBackground', value: 'paperCutBackground' },
					{ name: 'Photographic', value: 'photographic' },
					{ name: 'Realistic', value: 'realistic' },
					{ name: 'Retro80s', value: 'retro80s' },
					{ name: 'Stylistic', value: 'stylistic' },
					{ name: 'SunsetGlow', value: 'sunsetGlow' },
					{ name: 'SurrealBackdrop', value: 'surrealBackdrop' },
					{ name: 'SynthwaveBackdrop', value: 'synthwaveBackdrop' },
					{ name: 'UrbanRealism', value: 'urbanRealism' },
					{ name: 'VaporwaveBackdrop', value: 'vaporwaveBackdrop' },
					{ name: 'VintageFilm', value: 'vintageFilm' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const inputImage3Url = this.getNodeParameter('inputImage3Url', 0, '') as string;
		const swapPosition = this.getNodeParameter('swapPosition', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const outputStyle = this.getNodeParameter('outputStyle', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Face-Swap',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				inputImage3Url,
				swapPosition,
				prompt,
				width,
				height,
				outputStyle,
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
