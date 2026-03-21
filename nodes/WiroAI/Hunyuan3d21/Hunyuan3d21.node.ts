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

export class Hunyuan3d21 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Hunyuan3D-2.1 3D Model Generator',
		name: 'hunyuan3d21',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Hunyuan3D-2.1 AI 3D model generator for converting images into 3D assets. Perfect for designers',
		defaults: {
			name: 'Wiro - Hunyuan3D-2.1 3D Model Generator',
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
				displayName: 'Input Image URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Image file to be converted into a 3D mesh',
			},
			{
				displayName: 'Inference Steps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: 'Inferencesteps-help',
			},
			{
				displayName: 'Guidance Scale',
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
			{
				displayName: 'Octree Resolution',
				name: 'octree_resolution',
				type: 'number',
				default: 0,
				description: 'Resolution of the octree structure used for mesh extraction; higher values create more detailed geometry',
			},
			{
				displayName: 'Number Of Chunks',
				name: 'num_chunks',
				type: 'number',
				default: 0,
				description: 'Number of chunks for parallel processing during mesh generation',
			},
			{
				displayName: 'Max Number Of View',
				name: 'max_num_view',
				type: 'number',
				default: 0,
				description: 'Number of viewpoints used for multi-view texture synthesis',
			},
			{
				displayName: 'Texture Resolution',
				name: 'texture_resolution',
				type: 'number',
				default: 0,
				description: 'Resolution of the generated texture maps in pixels',
			},
			{
				displayName: 'Max Facenum',
				name: 'max_facenum',
				type: 'number',
				default: 0,
				description: 'Maximum polygon count for mesh simplification; set to 0 to disable face reduction',
			},
			{
				displayName: 'Remove Background',
				name: 'remove_background',
				type: 'options',
				default: 'false',
				description: 'Automatically removes the background from the input image before 3D generation',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
			{
				displayName: 'Generate Texture',
				name: 'generate_texture',
				type: 'options',
				default: 'false',
				description: 'Enables PBR texture generation including albedo, metallic, and roughness maps',
				options: [
					{ name: 'False', value: 'false' },
					{ name: 'True', value: 'true' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const scale = this.getNodeParameter('scale', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const octree_resolution = this.getNodeParameter('octree_resolution', 0, 0) as number;
		const num_chunks = this.getNodeParameter('num_chunks', 0, 0) as number;
		const max_num_view = this.getNodeParameter('max_num_view', 0, 0) as number;
		const texture_resolution = this.getNodeParameter('texture_resolution', 0, 0) as number;
		const max_facenum = this.getNodeParameter('max_facenum', 0, 0) as number;
		const remove_background = this.getNodeParameter('remove_background', 0, '') as string;
		const generate_texture = this.getNodeParameter('generate_texture', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/tencent/Hunyuan3D-2.1',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				steps,
				scale,
				seed,
				octree_resolution,
				num_chunks,
				max_num_view,
				texture_resolution,
				max_facenum,
				remove_background,
				generate_texture,
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
