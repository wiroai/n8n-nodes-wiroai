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

export class Imagen4 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Imagen V4',
		name: 'imagen4',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Google\'s imagen model v4',
		defaults: {
			name: 'Wiro - Imagen V4',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to generate the image',
			},
			{
				displayName: 'Numberofoutputs',
				name: 'samples',
				type: 'options',
				default: '1',
				description: 'Numberofoutputs-help',
				options: [
					{ name: '1', value: '1' },
					{ name: '2', value: '2' },
					{ name: '3', value: '3' },
					{ name: '4', value: '4' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				description: 'Set 0 to add watermark',
			},
			{
				displayName: 'Enhance Prompt',
				name: 'enhancePrompt',
				type: 'options',
				default: 'false',
				description: 'Use an LLM-based prompt rewriting feature to deliver higher quality images that better reflect the original prompt\'s intent',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Add Watermark',
				name: 'addWatermark',
				type: 'options',
				default: 'false',
				description: 'Add an invisible watermark to the generated images. If seed is other than 0 this will be set to false. Enter seed 0 to add watermark',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				description: 'Aspect ratio of the generated image',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '21:9', value: '21:9' },
					{ name: '4:3', value: '4:3' },
				],
			},
			{
				displayName: 'Person Generation',
				name: 'personGeneration',
				type: 'options',
				default: 'allow_adult',
				description: 'Allow generation of people by the model. The following values are supported: dont_allow: Disallow the inclusion of people or faces in images. allow_adult: Allow generation of adults only. allow_all: Allow generation of people of all ages',
				options: [
					{ name: 'Allow Adult', value: 'allow_adult' },
					{ name: 'Allow All', value: 'allow_all' },
					{ name: 'Dont Allow', value: 'dont_allow' },
				],
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'auto',
				description: 'The language code that corresponds to your text prompt language',
				options: [
					{ name: 'Auto', value: 'auto' },
					{ name: 'Chinese (Simplified)', value: 'zh' },
					{ name: 'Chinese (Traditional)', value: 'zh-TW' },
					{ name: 'English', value: 'en' },
					{ name: 'Hindi', value: 'hi' },
					{ name: 'Japanese', value: 'ja' },
					{ name: 'Korean', value: 'ko' },
					{ name: 'Portuguese', value: 'pt' },
					{ name: 'Spanish', value: 'es' },
				],
			},
			{
				displayName: 'Safety Setting',
				name: 'safetySetting',
				type: 'options',
				default: 'block_low_and_above',
				description: 'Block_low_and_above is strictest, block_medium_and_above blocks some prompts, block_only_high is most permissive but some prompts will still be blocked',
				options: [
					{ name: 'Block Low And Above', value: 'block_low_and_above' },
					{ name: 'Block Medium And Above', value: 'block_medium_and_above' },
					{ name: 'Block Only High', value: 'block_only_high' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const samples = this.getNodeParameter('samples', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, 0) as number;
		const enhancePrompt = this.getNodeParameter('enhancePrompt', 0, '') as string;
		const addWatermark = this.getNodeParameter('addWatermark', 0, '') as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const personGeneration = this.getNodeParameter('personGeneration', 0, '') as string;
		const language = this.getNodeParameter('language', 0, '') as string;
		const safetySetting = this.getNodeParameter('safetySetting', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/google/imagen-v4',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				samples,
				seed,
				enhancePrompt,
				addWatermark,
				aspectRatio,
				personGeneration,
				language,
				safetySetting,
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
