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

export class IconicLocations implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Iconic Locations',
		name: 'iconicLocations',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'This AI model places your image seamlessly into iconic landmarks and breathtaking locations aro',
		defaults: {
			name: 'Wiro - Iconic Locations',
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
				displayName: 'Iconic Location',
				name: 'iconicLocation',
				type: 'options',
				default: 'Acropolis',
				required: true,
				description: 'Select option for iconic location',
				options: [
					{ name: 'Acropolis', value: 'Acropolis' },
					{ name: 'Amazon Rainforest', value: 'Amazon Rainforest' },
					{ name: 'Angkor Wat', value: 'Angkor Wat' },
					{ name: 'Antelope Canyon', value: 'Antelope Canyon' },
					{ name: 'Arc De Triomphe', value: 'Arc de Triomphe' },
					{ name: 'Bali', value: 'Bali' },
					{ name: 'Barcelona', value: 'Barcelona' },
					{ name: 'Big Ben', value: 'Big Ben' },
					{ name: 'Blue Lagoon', value: 'Blue Lagoon' },
					{ name: 'Bondi Beach', value: 'Bondi Beach' },
					{ name: 'Bora Bora', value: 'Bora Bora' },
					{ name: 'Brooklyn Bridge', value: 'Brooklyn Bridge' },
					{ name: 'Buckingham Palace', value: 'Buckingham Palace' },
					{ name: 'Burj Khalifa', value: 'Burj Khalifa' },
					{ name: 'Chichen Itza', value: 'Chichen Itza' },
					{ name: 'Christ The Redeemer', value: 'Christ the Redeemer' },
					{ name: 'Cliffs Of Moher', value: 'Cliffs of Moher' },
					{ name: 'Colosseum', value: 'Colosseum' },
					{ name: 'Copacabana Beach', value: 'Copacabana Beach' },
					{ name: 'Easter Island', value: 'Easter Island' },
					{ name: 'Edinburgh Castle', value: 'Edinburgh Castle' },
					{ name: 'Eiffel Tower', value: 'Eiffel Tower' },
					{ name: 'Everest Base Camp', value: 'Everest Base Camp' },
					{ name: 'Florence', value: 'Florence' },
					{ name: 'Forbidden City', value: 'Forbidden City' },
					{ name: 'Fushimi Inari Shrine', value: 'Fushimi Inari Shrine' },
					{ name: 'Giant\'s Causeway', value: 'Giant\'s Causeway' },
					{ name: 'Golden Gate Bridge', value: 'Golden Gate Bridge' },
					{ name: 'Grand Canyon', value: 'Grand Canyon' },
					{ name: 'Great Wall Of China', value: 'Great Wall of China' },
					{ name: 'Hollywood Sign', value: 'Hollywood Sign' },
					{ name: 'Kilimanjaro', value: 'Kilimanjaro' },
					{ name: 'Leaning Tower Of Pisa', value: 'Leaning Tower of Pisa' },
					{ name: 'Lisbon', value: 'Lisbon' },
					{ name: 'Loch Ness', value: 'Loch Ness' },
					{ name: 'Louvre Museum', value: 'Louvre Museum' },
					{ name: 'Machu Picchu', value: 'Machu Picchu' },
					{ name: 'Maldives', value: 'Maldives' },
					{ name: 'Monument Valley', value: 'Monument Valley' },
					{ name: 'Mount Fuji', value: 'Mount Fuji' },
					{ name: 'Mount Rushmore', value: 'Mount Rushmore' },
					{ name: 'Neuschwanstein Castle', value: 'Neuschwanstein Castle' },
					{ name: 'Northern Lights', value: 'Northern Lights' },
					{ name: 'Notre Dame Cathedral', value: 'Notre Dame Cathedral' },
					{ name: 'Palace Of Versailles', value: 'Palace of Versailles' },
					{ name: 'Petra', value: 'Petra' },
					{ name: 'Pyramids Of Giza', value: 'Pyramids of Giza' },
					{ name: 'Random', value: 'Random' },
					{ name: 'Red Square', value: 'Red Square' },
					{ name: 'Reykjavik', value: 'Reykjavik' },
					{ name: 'Sagrada Familia', value: 'Sagrada Familia' },
					{ name: 'Santorini', value: 'Santorini' },
					{ name: 'Scottish Highlands', value: 'Scottish Highlands' },
					{ name: 'Shibuya Crossing', value: 'Shibuya Crossing' },
					{ name: 'St. Basil\'s Cathedral', value: 'St. Basil\'s Cathedral' },
					{ name: 'Statue Of Liberty', value: 'Statue of Liberty' },
					{ name: 'Stonehenge', value: 'Stonehenge' },
					{ name: 'Sydney Opera House', value: 'Sydney Opera House' },
					{ name: 'Taj Mahal', value: 'Taj Mahal' },
					{ name: 'Times Square', value: 'Times Square' },
					{ name: 'Tokyo Tower', value: 'Tokyo Tower' },
					{ name: 'Tower Bridge', value: 'Tower Bridge' },
					{ name: 'Trevi Fountain', value: 'Trevi Fountain' },
					{ name: 'Vatican City', value: 'Vatican City' },
					{ name: 'Venice', value: 'Venice' },
					{ name: 'Victoria Falls', value: 'Victoria Falls' },
					{ name: 'Yosemite', value: 'Yosemite' },
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
		const iconicLocation = this.getNodeParameter('iconicLocation', 0) as string;
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
			url: 'https://api.wiro.ai/v1/Run/wiro/iconic-locations',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				iconicLocation,
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
