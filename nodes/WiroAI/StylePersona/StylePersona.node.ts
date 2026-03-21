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

export class StylePersona implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Style Persona',
		name: 'stylePersona',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'This model applies unique styles and personas to your image',
		defaults: {
			name: 'Wiro - Style Persona',
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
				displayName: 'Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Image to use as reference. Must be jpeg, png.',
			},
			{
				displayName: 'Style',
				name: 'style',
				type: 'options',
				default: 'Anime',
				required: true,
				description: 'The artistic style to apply to the image',
				options: [
					{ name: 'Anime', value: 'Anime' },
					{ name: 'Cartoon', value: 'Cartoon' },
					{ name: 'Clay', value: 'Clay' },
					{ name: 'Gothic', value: 'Gothic' },
					{ name: 'Graphic Novel', value: 'Graphic Novel' },
					{ name: 'Lego', value: 'Lego' },
					{ name: 'Memoji', value: 'Memoji' },
					{ name: 'Minecraft', value: 'Minecraft' },
					{ name: 'Minimalist', value: 'Minimalist' },
					{ name: 'Pixel Art', value: 'Pixel Art' },
					{ name: 'Random', value: 'Random' },
					{ name: 'Simpsons', value: 'Simpsons' },
					{ name: 'Sketch', value: 'Sketch' },
					{ name: 'South Park', value: 'South Park' },
					{ name: 'Toy', value: 'Toy' },
					{ name: 'Watercolor', value: 'Watercolor' },
				],
			},
			{
				displayName: 'Persona',
				name: 'persona',
				type: 'options',
				default: 'Angel',
				required: true,
				description: 'Select option for persona',
				options: [
					{ name: 'Angel', value: 'Angel' },
					{ name: 'Astronaut', value: 'Astronaut' },
					{ name: 'Demon', value: 'Demon' },
					{ name: 'Mage', value: 'Mage' },
					{ name: 'Na\'vi', value: 'Na\'vi' },
					{ name: 'Ninja', value: 'Ninja' },
					{ name: 'None', value: 'None' },
					{ name: 'Random', value: 'Random' },
					{ name: 'Robot', value: 'Robot' },
					{ name: 'Samurai', value: 'Samurai' },
					{ name: 'Vampire', value: 'Vampire' },
					{ name: 'Werewolf', value: 'Werewolf' },
					{ name: 'Zombie', value: 'Zombie' },
				],
			},
			{
				displayName: 'Same Outfit',
				name: 'outfit',
				type: 'boolean',
				default: false,
				description: 'Whether to enable outfit',
			},
			{
				displayName: 'Same Background',
				name: 'background',
				type: 'boolean',
				default: false,
				description: 'Whether to enable background',
			},
			{
				displayName: 'Safety Tolerance',
				name: 'safetyTolerance',
				type: 'options',
				default: '2',
				description: 'Tolerance level for input and output moderation. Between 0 and 6, 0 being most strict, 6 being least strict.',
				options: [
					{ name: '2', value: '2' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Aspect ratio of the image',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '1:2', value: '1:2' },
					{ name: '16:9', value: '16:9' },
					{ name: '2:1', value: '2:1' },
					{ name: '2:3', value: '2:3' },
					{ name: '21:9', value: '21:9' },
					{ name: '3:2', value: '3:2' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '4:5', value: '4:5' },
					{ name: '5:4', value: '5:4' },
					{ name: '9:16', value: '9:16' },
					{ name: '9:21', value: '9:21' },
					{ name: 'Match Input Image', value: '' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'jpeg',
				description: 'Output format for the generated image. Can be \'jpeg\' or \'png\'.',
				options: [
					{ name: 'Jpeg', value: 'jpeg' },
					{ name: 'Png', value: 'png' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const style = this.getNodeParameter('style', 0) as string;
		const persona = this.getNodeParameter('persona', 0) as string;
		const outfit = this.getNodeParameter('outfit', 0, false) as boolean;
		const background = this.getNodeParameter('background', 0, false) as boolean;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0, '') as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/style-persona',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				style,
				persona,
				outfit,
				background,
				safetyTolerance,
				aspectRatio,
				seed,
				outputFormat,
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
