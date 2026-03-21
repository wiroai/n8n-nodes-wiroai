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

export class FacelessVideoGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Faceless Video Generator',
		name: 'facelessVideoGenerator',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create professional short videos (30s) for YouTube Shorts, Instagram Reels, TikTok, and X (Twit',
		defaults: {
			name: 'Wiro - Faceless Video Generator',
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
				description: 'The prompt to generate the video',
			},
			{
				displayName: 'Video Model',
				name: 'videoModel',
				type: 'options',
				default: 'seedance-lite-v1',
				required: true,
				description: 'Select the video generation model',
				options: [
					{ name: 'ByteDance Seedance Lite V1', value: 'seedance-lite-v1' },
					{ name: 'ByteDance Seedance Pro V1', value: 'seedance-pro-v1' },
					{ name: 'Google Veo 3.1', value: 'veo-3.1' },
					{ name: 'Google Veo 3.1 Fast', value: 'veo-3.1-fast' },
					{ name: 'KlingAI V2.1', value: 'klingai-v2.1' },
					{ name: 'MiniMax Hailuo 2.3', value: 'hailuo-2.3' },
					{ name: 'MiniMax Hailuo 2.3 Fast', value: 'hailuo-2.3-fast' },
					{ name: 'OpenAI Sora 2', value: 'sora-2' },
					{ name: 'OpenAI Sora 2 Pro', value: 'sora-2-pro' },
					{ name: 'Wan2.2', value: 'Wan2.2' },
				],
			},
			{
				displayName: 'Total Video Seconds',
				name: 'totalVideoSeconds',
				type: 'options',
				default: '10',
				description: 'Total duration of the generated video (in seconds)',
				options: [
					{ name: '10s', value: '10' },
					{ name: '15s', value: '15' },
					{ name: '20s', value: '20' },
					{ name: '25s', value: '25' },
					{ name: '30s', value: '30' },
				],
			},
			{
				displayName: 'Video Quality',
				name: 'videoQuality',
				type: 'options',
				default: '1080p',
				required: true,
				description: 'Select the resolution for your video output',
				options: [
					{ name: '1080p', value: '1080p' },
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Caption Effect',
				name: 'captionEffect',
				type: 'options',
				default: 'wordbyword',
				description: 'Choose how captions appear: \'Typewriter\' builds the sentence word by word, \'Sentence\' displays the whole sentence at once, \'Flash Each Word\' shows words briefly\'',
				options: [
					{ name: 'Flash Each Word', value: 'wordbyword' },
					{ name: 'Sentence', value: 'sentence' },
					{ name: 'Typewriter', value: 'word' },
				],
			},
			{
				displayName: 'TTS Voice',
				name: 'ttsVoice',
				type: 'options',
				default: 'am_adam',
				required: true,
				description: 'Select the voice character for TTS',
				options: [
					{ name: 'Adam', value: 'am_adam' },
					{ name: 'Alex', value: 'em_alex' },
					{ name: 'Alice', value: 'bf_alice' },
					{ name: 'Alloy', value: 'af_alloy' },
					{ name: 'Alpha', value: 'hf_alpha' },
					{ name: 'Aoede', value: 'af_aoede' },
					{ name: 'Bella', value: 'af_bella' },
					{ name: 'Beta', value: 'hf_beta' },
					{ name: 'Daniel', value: 'bm_daniel' },
					{ name: 'Dora', value: 'ef_dora' },
					{ name: 'Echo', value: 'am_echo' },
					{ name: 'Emma', value: 'bf_emma' },
					{ name: 'Eric', value: 'am_eric' },
					{ name: 'Fable', value: 'bm_fable' },
					{ name: 'Fenrir', value: 'am_fenrir' },
					{ name: 'George', value: 'bm_george' },
					{ name: 'Gongitsune', value: 'jf_gongitsune' },
					{ name: 'Heart', value: 'af_heart' },
					{ name: 'Isabella', value: 'bf_isabella' },
					{ name: 'Jessica', value: 'af_jessica' },
					{ name: 'Kore', value: 'af_kore' },
					{ name: 'Kumo', value: 'jm_kumo' },
					{ name: 'Lewis', value: 'bm_lewis' },
					{ name: 'Liam', value: 'am_liam' },
					{ name: 'Lily', value: 'bf_lily' },
					{ name: 'Michael', value: 'am_michael' },
					{ name: 'Nezumi', value: 'jf_nezumi' },
					{ name: 'Nicola', value: 'im_nicola' },
					{ name: 'Nicole', value: 'af_nicole' },
					{ name: 'Nova', value: 'af_nova' },
					{ name: 'Omega', value: 'hm_omega' },
					{ name: 'Onyx', value: 'am_onyx' },
					{ name: 'Psi', value: 'hm_psi' },
					{ name: 'Puck', value: 'am_puck' },
					{ name: 'River', value: 'af_river' },
					{ name: 'Santa', value: 'am_santa' },
					{ name: 'Sara', value: 'if_sara' },
					{ name: 'Sarah', value: 'af_sarah' },
					{ name: 'Siwis', value: 'ff_siwis' },
					{ name: 'Sky', value: 'af_sky' },
					{ name: 'Tebukuro', value: 'jf_tebukuro' },
					{ name: 'Xiaobei', value: 'zf_xiaobei' },
					{ name: 'Xiaoni', value: 'zf_xiaoni' },
					{ name: 'Xiaoxiao', value: 'zf_xiaoxiao' },
					{ name: 'Xiaoyi', value: 'zf_xiaoyi' },
					{ name: 'Yunjian', value: 'zm_yunjian' },
					{ name: 'Yunxi', value: 'zm_yunxi' },
					{ name: 'Yunxia', value: 'zm_yunxia' },
					{ name: 'Yunyang', value: 'zm_yunyang' },
				],
			},
			{
				displayName: 'Reveal Full Sentence',
				name: 'revealFullSentence',
				type: 'options',
				default: 'false',
				description: 'Only relevant when \'Flash Each Word\' is selected. Determines whether the full sentence is shown after the animation.',
				options: [
					{ name: 'NO', value: 'false' },
					{ name: 'YES', value: 'true' },
				],
			},
			{
				displayName: 'Speech Speed',
				name: 'speechSpeed',
				type: 'number',
				default: 0,
				description: 'Change the speed of the generated voice',
			},
			{
				displayName: 'Talking Head Display',
				name: 'talkingHeadDisplay',
				type: 'options',
				default: 'false',
				description: 'Select the talking head visibility',
				options: [
					{ name: 'NO', value: 'false' },
					{ name: 'YES', value: 'true' },
				],
			},
			{
				displayName: 'Talking Head Image Url',
				name: 'talkingHeadImageUrl',
				type: 'string',
				default: '',
				description: 'Provide a talking head image URL if “Talking Head Display” is set to YES',
			},
			{
				displayName: 'Caption Position',
				name: 'captionPosition',
				type: 'options',
				default: 'bottom',
				description: 'Select the caption position',
				options: [
					{ name: 'BOTTOM', value: 'bottom' },
					{ name: 'CENTER', value: 'center' },
					{ name: 'TOP', value: 'top' },
				],
			},
			{
				displayName: 'Caption Font Family',
				name: 'captionFontFamily',
				type: 'options',
				default: 'Poppins-Black',
				description: 'Select the caption font family',
				options: [
					{ name: 'Poppins Black', value: 'Poppins-Black' },
					{ name: 'Poppins Black Italic', value: 'Poppins-BlackItalic' },
					{ name: 'Poppins Bold', value: 'Poppins-Bold' },
					{ name: 'Poppins Bold Italic', value: 'Poppins-BoldItalic' },
					{ name: 'Poppins Extra Bold', value: 'Poppins-ExtraBold' },
					{ name: 'Poppins Extra Bold Italic', value: 'Poppins-ExtraBoldItalic' },
					{ name: 'Poppins Extra Light', value: 'Poppins-ExtraLight' },
					{ name: 'Poppins Extra Light Italic', value: 'Poppins-ExtraLightItalic' },
					{ name: 'Poppins Italic', value: 'Poppins-Italic' },
					{ name: 'Poppins Light', value: 'Poppins-Light' },
					{ name: 'Poppins Light Italic', value: 'Poppins-LightItalic' },
					{ name: 'Poppins Medium', value: 'Poppins-Medium' },
					{ name: 'Poppins Medium Italic', value: 'Poppins-MediumItalic' },
					{ name: 'Poppins Regular', value: 'Poppins-Regular' },
					{ name: 'Poppins Semi Bold', value: 'Poppins-SemiBold' },
					{ name: 'Poppins Semi Bold Italic', value: 'Poppins-SemiBoldItalic' },
					{ name: 'Poppins Thin', value: 'Poppins-Thin' },
					{ name: 'Poppins Thin Italic', value: 'Poppins-ThinItalic' },
				],
			},
			{
				displayName: 'Caption Font Color',
				name: 'captionFontColor',
				type: 'color',
				default: '',
				description: 'Enter a hex color code (e.g. #FFFFFF) to set the caption text color',
			},
			{
				displayName: 'Caption Box Color',
				name: 'captionBoxColor',
				type: 'color',
				default: '',
				description: 'Enter a hex color code (e.g. #FFFFFF) to set the caption box color',
			},
			{
				displayName: 'Caption Box Opacity',
				name: 'captionBoxOpacity',
				type: 'string',
				default: '',
				description: 'Adjust the transparency of the caption background box',
			},
			{
				displayName: 'Cover Effect',
				name: 'coverEffect',
				type: 'options',
				default: 'pan-left',
				description: 'Motion effect for cover/hook video',
				options: [
					{ name: 'Pan Left', value: 'pan-left' },
					{ name: 'Pan Right', value: 'pan-right' },
					{ name: 'Static', value: 'static' },
					{ name: 'Zoom In (Ken Burns)', value: 'zoom-in' },
					{ name: 'Zoom In + Pan Right (Dynamic)', value: 'zoom-in-pan-right' },
					{ name: 'Zoom Out', value: 'zoom-out' },
				],
			},
			{
				displayName: 'Cover Animation Speed',
				name: 'coverAnimationSpeed',
				type: 'options',
				default: '0.5',
				description: 'Animation speed multiplier (0.5=slow, 2.0=fast)',
				options: [
					{ name: '0.5x (Slow & Smooth)', value: '0.5' },
					{ name: '0.75x (Gentle)', value: '0.75' },
					{ name: '1.0x (Normal)', value: '1.0' },
					{ name: '1.25x (Slightly Fast)', value: '1.25' },
					{ name: '1.5x (Fast)', value: '1.5' },
					{ name: '2.0x (Very Fast)', value: '2.0' },
				],
			},
			{
				displayName: 'Cover Font Family',
				name: 'coverFontFamily',
				type: 'options',
				default: 'Poppins-Black',
				description: 'Select the cover font family',
				options: [
					{ name: 'Poppins Black', value: 'Poppins-Black' },
					{ name: 'Poppins Black Italic', value: 'Poppins-BlackItalic' },
					{ name: 'Poppins Bold', value: 'Poppins-Bold' },
					{ name: 'Poppins Bold Italic', value: 'Poppins-BoldItalic' },
					{ name: 'Poppins Extra Bold', value: 'Poppins-ExtraBold' },
					{ name: 'Poppins Extra Bold Italic', value: 'Poppins-ExtraBoldItalic' },
					{ name: 'Poppins Extra Light', value: 'Poppins-ExtraLight' },
					{ name: 'Poppins Extra Light Italic', value: 'Poppins-ExtraLightItalic' },
					{ name: 'Poppins Italic', value: 'Poppins-Italic' },
					{ name: 'Poppins Light', value: 'Poppins-Light' },
					{ name: 'Poppins Light Italic', value: 'Poppins-LightItalic' },
					{ name: 'Poppins Medium', value: 'Poppins-Medium' },
					{ name: 'Poppins Medium Italic', value: 'Poppins-MediumItalic' },
					{ name: 'Poppins Regular', value: 'Poppins-Regular' },
					{ name: 'Poppins Semi Bold', value: 'Poppins-SemiBold' },
					{ name: 'Poppins Semi Bold Italic', value: 'Poppins-SemiBoldItalic' },
					{ name: 'Poppins Thin', value: 'Poppins-Thin' },
					{ name: 'Poppins Thin Italic', value: 'Poppins-ThinItalic' },
				],
			},
			{
				displayName: 'Cover Font Color',
				name: 'coverFontColor',
				type: 'color',
				default: '',
				description: 'Enter a hex color code (e.g. #FFFFFF) to set the cover text color',
			},
			{
				displayName: 'Cover Box Color',
				name: 'coverBoxColor',
				type: 'color',
				default: '',
				description: 'Enter a hex color code (e.g. #FFFFFF) to set the cover box color',
			},
			{
				displayName: 'Cover Box Opacity',
				name: 'coverBoxOpacity',
				type: 'string',
				default: '',
				description: 'Adjust the transparency of the cover background box',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const videoModel = this.getNodeParameter('videoModel', 0) as string;
		const totalVideoSeconds = this.getNodeParameter('totalVideoSeconds', 0, '') as string;
		const videoQuality = this.getNodeParameter('videoQuality', 0) as string;
		const captionEffect = this.getNodeParameter('captionEffect', 0, '') as string;
		const ttsVoice = this.getNodeParameter('ttsVoice', 0) as string;
		const revealFullSentence = this.getNodeParameter('revealFullSentence', 0, '') as string;
		const speechSpeed = this.getNodeParameter('speechSpeed', 0, 0) as number;
		const talkingHeadDisplay = this.getNodeParameter('talkingHeadDisplay', 0, '') as string;
		const talkingHeadImageUrl = this.getNodeParameter('talkingHeadImageUrl', 0, '') as string;
		const captionPosition = this.getNodeParameter('captionPosition', 0, '') as string;
		const captionFontFamily = this.getNodeParameter('captionFontFamily', 0, '') as string;
		const captionFontColor = this.getNodeParameter('captionFontColor', 0, '') as string;
		const captionBoxColor = this.getNodeParameter('captionBoxColor', 0, '') as string;
		const captionBoxOpacity = this.getNodeParameter('captionBoxOpacity', 0, '') as string;
		const coverEffect = this.getNodeParameter('coverEffect', 0, '') as string;
		const coverAnimationSpeed = this.getNodeParameter('coverAnimationSpeed', 0, '') as string;
		const coverFontFamily = this.getNodeParameter('coverFontFamily', 0, '') as string;
		const coverFontColor = this.getNodeParameter('coverFontColor', 0, '') as string;
		const coverBoxColor = this.getNodeParameter('coverBoxColor', 0, '') as string;
		const coverBoxOpacity = this.getNodeParameter('coverBoxOpacity', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/Faceless-Video-Generator',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				videoModel,
				totalVideoSeconds,
				videoQuality,
				captionEffect,
				ttsVoice,
				revealFullSentence,
				speechSpeed,
				talkingHeadDisplay,
				talkingHeadImageUrl,
				captionPosition,
				captionFontFamily,
				captionFontColor,
				captionBoxColor,
				captionBoxOpacity,
				coverEffect,
				coverAnimationSpeed,
				coverFontFamily,
				coverFontColor,
				coverBoxColor,
				coverBoxOpacity,
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
