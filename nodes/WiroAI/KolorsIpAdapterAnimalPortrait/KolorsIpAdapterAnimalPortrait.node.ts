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

export class KolorsIpAdapterAnimalPortrait implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Kolors Ip Adapter Animal Portrait',
		name: 'kolorsIpAdapterAnimalPortrait',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Kolors Animal Portrait Tool',
		defaults: {
			name: 'Wiro - Kolors Ip Adapter Animal Portrait',
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
				displayName: 'Ip Image Path URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Input-image-help',
			},
			{
				displayName: 'Inferencesteps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Numberofoutputs',
				name: 'samples',
				type: 'number',
				default: 0,
				description: 'Numberofoutputs-help',
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
				displayName: 'Guidancescale',
				name: 'scale',
				type: 'number',
				default: 0,
				description: 'Guidancescale-help',
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

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const samples = this.getNodeParameter('samples', 0, 0) as number;
		const width = this.getNodeParameter('width', 0, 0) as number;
		const height = this.getNodeParameter('height', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/kolors-ip-adapter-animal-portrait',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				steps,
				samples,
				width,
				height,
				scale,
				seed,
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
