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

export class ExtremeScenarios implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Extreme Scenarios',
		name: 'extremeScenarios',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Turn your selfies into blockbusters! This AI tool takes your image and places it into dramatic,',
		defaults: {
			name: 'Wiro - Extreme Scenarios',
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
				description: 'Image to use as reference. Must be jpeg, png.',
			},
			{
				displayName: 'Extreme Scenario',
				name: 'extremeScenario',
				type: 'options',
				default: 'Avalanche escape on skis',
				required: true,
				description: 'Select option for extreme scenario',
				options: [
					{ name: 'Avalanche Escape On Skis', value: 'Avalanche escape on skis' },
					{ name: 'Base Jumping Off A Skyscraper', value: 'Base jumping off a skyscraper' },
					{ name: 'Bungee Jumping From A Helicopter', value: 'Bungee jumping from a helicopter' },
					{ name: 'Deep Sea Diving With Giant Whales', value: 'Deep sea diving with giant whales' },
					{ name: 'Dragon Encounter In Medieval Armor', value: 'Dragon encounter in medieval armor' },
					{ name: 'Floating In Space As An Astronaut', value: 'Floating in space as an astronaut' },
					{ name: 'Flying Through Clouds Without Equipment', value: 'Flying through clouds without equipment' },
					{ name: 'Free Climbing El Capitan Without Ropes', value: 'Free climbing El Capitan without ropes' },
					{ name: 'Gorilla Encounter In Dense Jungle', value: 'Gorilla encounter in dense jungle' },
					{ name: 'Hanging From A Helicopter Ladder', value: 'Hanging from a helicopter ladder' },
					{ name: 'High Speed Car Chase As Driver', value: 'High-speed car chase as driver' },
					{ name: 'Levitating With Magical Energy', value: 'Levitating with magical energy' },
					{ name: 'Lightning Strike Survivor In A Storm', value: 'Lightning strike survivor in a storm' },
					{ name: 'Motorcycle Jumping Over Helicopters', value: 'Motorcycle jumping over helicopters' },
					{ name: 'Parachuting Into A Volcano', value: 'Parachuting into a volcano' },
					{ name: 'Random', value: 'Random' },
					{ name: 'Riding On The Back Of A Great White Shark', value: 'Riding on the back of a great white shark' },
					{ name: 'Running With A Pack Of Cheetahs', value: 'Running with a pack of cheetahs' },
					{ name: 'Skydiving From 30,000 Feet', value: 'Skydiving from 30,000 feet' },
					{ name: 'Spacewalk Outside The International Space Station', value: 'Spacewalk outside the International Space Station' },
					{ name: 'Standing Face To Face With A Roaring Lion', value: 'Standing face-to-face with a roaring lion' },
					{ name: 'Standing In The Eye Of A Hurricane', value: 'Standing in the eye of a hurricane' },
					{ name: 'Standing On Mars In A Spacesuit', value: 'Standing on Mars in a spacesuit' },
					{ name: 'Standing On Top Of Mount Everest', value: 'Standing on top of Mount Everest' },
					{ name: 'Superhero Landing With Impact Crater', value: 'Superhero landing with impact crater' },
					{ name: 'Surfing A Massive Tsunami Wave', value: 'Surfing a massive tsunami wave' },
					{ name: 'Swimming With Great White Sharks', value: 'Swimming with great white sharks' },
					{ name: 'Swimming With Killer Whales In Arctic Waters', value: 'Swimming with killer whales in Arctic waters' },
					{ name: 'Underwater With Full Scuba Gear Surrounded By Jellyfish', value: 'Underwater with full scuba gear surrounded by jellyfish' },
					{ name: 'Volcano Exploration In Heat Proof Suit', value: 'Volcano exploration in heat-proof suit' },
					{ name: 'Walking On The Moon Surface', value: 'Walking on the moon surface' },
					{ name: 'Wingsuit Flying Through Mountains', value: 'Wingsuit flying through mountains' },
					{ name: 'Zipline Across The Grand Canyon', value: 'Zipline across the Grand Canyon' },
				],
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
		const extremeScenario = this.getNodeParameter('extremeScenario', 0) as string;
		const safetyTolerance = this.getNodeParameter('safetyTolerance', 0, '') as string;
		const aspectRatio = this.getNodeParameter('aspectRatio', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const outputFormat = this.getNodeParameter('outputFormat', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/extreme-scenarios',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				extremeScenario,
				safetyTolerance,
				aspectRatio,
				seed,
				outputFormat,
			},
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
