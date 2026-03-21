import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeApiError,
} from 'n8n-workflow';

import { generateWiroAuthHeaders } from '../utils/auth';
import { pollTaskUntilComplete } from '../utils/polling';

export class StoryDiffusion implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Story Diffusion',
		name: 'storyDiffusion',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'It generates comic book-style images of the entered storylines in sequence. Additionally, we ca',
		defaults: {
			name: 'Wiro - Story Diffusion',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'wiroApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Pad Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'The image we want the output to reference',
			},
			{
				displayName: 'Init Image URL',
				name: 'inputImage2Url',
				type: 'string',
				default: '',
				description: 'Init-image-help',
			},
			{
				displayName: 'Character Detail Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'If init_image is used, the \'img\' trigger word must be added to character-details-prompt',
			},
			{
				displayName: 'Prompt',
				name: 'generalPrompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Images are produced as many times as the entered prompt amount. Format: ....|.....|.....|. If you need to change the caption, add a # at the end of each line. [NC]symbol (The [NC] symbol is used as a flag to indicate that no characters(init-image) should be present in the generated scene images. If you want do that, prepend the \'[NC]\' at the beginning of the line. For example, to generate a scene of falling leaves without any character, write: \'[NC] The leaves are falling.\'),Currently, support is only using Textual Description',
			},
			{
				displayName: 'Negativeprompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Negativeprompt-help',
			},
			{
				displayName: 'Extra Event Prompt',
				name: 'extraEventPrompts',
				type: 'string',
				default: '',
				description: 'Format: ....|....|',
			},
			{
				displayName: 'Style Name',
				name: 'styleName',
				type: 'options',
				default: 'Black and White Film Noir',
				description: 'Style-name-help',
				options: [
					{ name: 'Black And White Film Noir', value: 'Black and White Film Noir' },
					{ name: 'Comic Book', value: 'Comic book' },
					{ name: 'Digital/Oil Painting', value: 'Digital/Oil Painting' },
					{ name: 'Isometric Rooms', value: 'Isometric Rooms' },
					{ name: 'Japanese Anime', value: 'Japanese Anime' },
					{ name: 'Line Art', value: 'Line art' },
					{ name: 'Photographic', value: 'Photographic' },
					{ name: 'Pixar/Disney Character', value: 'Pixar/Disney Character' },
				],
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
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
				displayName: 'Font Size',
				name: 'fontSize',
				type: 'number',
				default: 0,
				description: 'Font-size-help',
			},
			{
				displayName: 'ID Image Length',
				name: 'imageLength',
				type: 'number',
				default: 0,
				description: 'ID-image-length-help',
			},
			{
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Seed-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const inputImage2Url = this.getNodeParameter('inputImage2Url', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const generalPrompt = this.getNodeParameter('generalPrompt', 0) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', 0, '') as string;
		const extraEventPrompts = this.getNodeParameter('extraEventPrompts', 0, '') as string;
		const styleName = this.getNodeParameter('styleName', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const fontSize = this.getNodeParameter('fontSize', 0, 0) as number;
		const imageLength = this.getNodeParameter('imageLength', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/story-diffusion',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				inputImage2Url,
				prompt,
				generalPrompt,
				negativePrompt,
				extraEventPrompts,
				styleName,
				steps,
				width,
				height,
				fontSize,
				imageLength,
				scale,
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
