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

export class ShortsReelsVideoGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Generate Shorts/Reels Video',
		name: 'shortsReelsVideoGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generates short video content from prompt using Wiro.',
		defaults: {
			name: 'Wiro - Generate Shorts/Reels Video',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description:
					'Type what you want the video to be about, The AI will generate a short video accordingly',
			},
			{
				displayName: 'Video Duration (Seconds)',
				name: 'totalVideoSeconds',
				type: 'options',
				default: '10',
				options: [
					{ name: '10', value: '10' },
					{ name: '15', value: '15' },
					{ name: '20', value: '20' },
					{ name: '25', value: '25' },
					{ name: '30', value: '30' },
				],
				description: 'Select the total duration of the generated video',
			},
			{
				displayName: 'Video Mode',
				name: 'videoMode',
				type: 'options',
				default: 'std',
				options: [
					{ name: 'Standard', value: 'std' },
					{ name: 'Professional', value: 'pro' },
				],
				description: 'Choose standard or professional video mode',
			},
			{
				displayName: 'Video Quality',
				name: 'videoQuality',
				type: 'options',
				default: '480p',
				options: [
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
					{ name: '1080p', value: '1080p' },
				],
				description: 'Choose resolution of the video',
			},
			{
				displayName: 'Caption Effect',
				name: 'captionEffect',
				type: 'options',
				default: 'word',
				options: [
					{ name: 'Flash Each Word', value: 'wordbyword' },
					{ name: 'Full Sentence', value: 'sentence' },
					{ name: 'Typewriter', value: 'word' },
				],
				description: 'Choose how captions appear in the video',
			},
			{
				displayName: 'Reveal Full Sentence',
				name: 'revealFullSentence',
				type: 'boolean',
				default: false,
				description: 'Whether show full sentence after caption animation',
			},
			{
				displayName: 'Speech Speed',
				name: 'speechSpeed',
				type: 'string',
				default: '1.3',
				description: 'Adjust the speed of speech in the video',
			},
			{
				displayName: 'Talking Head Display',
				name: 'talkingHeadDisplay',
				type: 'boolean',
				default: false,
				description: 'Whether enable or disable talking head display',
			},
			{
				displayName: 'Talking Head Image URL',
				name: 'talkingHeadImageUrl',
				type: 'string',
				default: '',
				description: 'Provide a URL to a custom talking head image',
			},
			{
				displayName: 'Caption Position',
				name: 'captionPosition',
				type: 'options',
				default: 'bottom',
				options: [
					{ name: 'Top', value: 'top' },
					{ name: 'Bottom', value: 'bottom' },
				],
				description: 'Where captions will appear in the video',
			},
			{
				displayName: 'Caption Font Family',
				name: 'captionFontFamily',
				type: 'options',
				// options load with function
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: 'Poppins-Bold',
				options: getPoppinsFontOptions(),
				description: 'Font used in captions',
			},
			{
				displayName: 'Caption Font Color (Hex)',
				name: 'captionFontColor',
				type: 'color',
				default: '#FFFFFF',
				description: 'Font color for captions in HEX format',
			},
			{
				displayName: 'Caption Box Color (Hex)',
				name: 'captionBoxColor',
				type: 'color',
				default: '#000000',
				description: 'Background color of caption box',
			},
			{
				displayName: 'Caption Box Opacity (0.0 - 1.0)',
				name: 'captionBoxOpacity',
				type: 'string',
				default: '0.0',
				description: 'Opacity level for caption box',
			},
			{
				displayName: 'Cover Font Family',
				name: 'coverFontFamily',
				type: 'options',
				// options load with function
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: 'Poppins-Bold',
				options: getPoppinsFontOptions(),
				description: 'Font used in cover screen',
			},
			{
				displayName: 'Cover Font Color (Hex)',
				name: 'coverFontColor',
				type: 'color',
				default: '#FFFFFF',
				description: 'Font color for cover screen',
			},
			{
				displayName: 'Cover Box Color (Hex)',
				name: 'coverBoxColor',
				type: 'color',
				default: '#000000',
				description: 'Box color on cover screen',
			},
			{
				displayName: 'Cover Box Opacity (0.0 - 1.0)',
				name: 'coverBoxOpacity',
				type: 'string',
				default: '0.0',
				description: 'Opacity for cover box',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '7245922',
				description: 'Enter a seed for reproducible results',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const totalVideoSeconds = this.getNodeParameter('totalVideoSeconds', 0) as string;
		const videoMode = this.getNodeParameter('videoMode', 0) as string;
		const videoQuality = this.getNodeParameter('videoQuality', 0) as string;
		const captionEffect = this.getNodeParameter('captionEffect', 0) as string;
		const revealFullSentence = this.getNodeParameter('revealFullSentence', 0) as boolean;
		const speechSpeed = this.getNodeParameter('speechSpeed', 0) as string;
		const talkingHeadDisplay = this.getNodeParameter('talkingHeadDisplay', 0) as boolean;
		const talkingHeadImageUrl = this.getNodeParameter('talkingHeadImageUrl', 0) as string;
		const captionPosition = this.getNodeParameter('captionPosition', 0) as string;
		const captionFontFamily = this.getNodeParameter('captionFontFamily', 0) as string;
		const captionFontColor = this.getNodeParameter('captionFontColor', 0) as string;
		const captionBoxColor = this.getNodeParameter('captionBoxColor', 0) as string;
		const captionBoxOpacity = this.getNodeParameter('captionBoxOpacity', 0) as string;
		const coverFontFamily = this.getNodeParameter('coverFontFamily', 0) as string;
		const coverFontColor = this.getNodeParameter('coverFontColor', 0) as string;
		const coverBoxColor = this.getNodeParameter('coverBoxColor', 0) as string;
		const coverBoxOpacity = this.getNodeParameter('coverBoxOpacity', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const body = {
			prompt,
			totalVideoSeconds,
			videoMode,
			videoQuality,
			captionEffect,
			revealFullSentence,
			speechSpeed,
			talkingHeadDisplay,
			talkingHeadImageUrl,
			captionPosition,
			captionFontFamily,
			captionFontColor,
			captionBoxColor,
			captionBoxOpacity,
			coverFontFamily,
			coverFontColor,
			coverBoxColor,
			coverBoxOpacity,
			seed,
		};

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Shorts-Reels-Video-Generator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body,
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

function getPoppinsFontOptions() {
	return [
		'Thin',
		'ThinItalic',
		'ExtraLight',
		'ExtraLightItalic',
		'Light',
		'LightItalic',
		'Regular',
		'Italic',
		'Medium',
		'MediumItalic',
		'SemiBold',
		'SemiBoldItalic',
		'Bold',
		'BoldItalic',
		'ExtraBold',
		'ExtraBoldItalic',
		'Black',
		'BlackItalic',
	].map((style) => ({
		name: `Poppins ${style.replace(/([A-Z])/g, ' $1').trim()}`,
		value: `Poppins-${style}`,
	}));
}
