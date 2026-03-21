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

export class Trellis2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Trellis-2 3D Mesh Generator',
		name: 'trellis2',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate high-quality 3D meshes from images with Trellis-2 AI. Perfect for 3D modeling, gaming,',
		defaults: {
			name: 'Wiro - Trellis-2 3D Mesh Generator',
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
				description: 'Image to convert into a 3D mesh; background is automatically removed if no alpha channel is present',
			},
			{
				displayName: 'Resolution',
				name: 'pipeline_type',
				type: 'options',
				default: '1024_cascade',
				description: '3D generation resolution: 512 (fastest), 1024 (recommended), 1536 (highest quality)',
				options: [
					{ name: '1024', value: '1024_cascade' },
					{ name: '1536', value: '1536_cascade' },
					{ name: '512', value: '512' },
				],
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed for reproducible results; 0 picks a random seed automatically',
			},
			{
				displayName: 'Texture Size',
				name: 'texture_size',
				type: 'options',
				default: '1024',
				description: 'PBR texture map resolution in pixels for the GLB export',
				options: [
					{ name: '1024', value: '1024' },
					{ name: '2048', value: '2048' },
					{ name: '4096', value: '4096' },
					{ name: '8192', value: '8192' },
				],
			},
			{
				displayName: 'Decimation Target',
				name: 'decimation_target',
				type: 'number',
				default: 0,
				description: 'Target face count for GLB mesh decimation; higher = more detail but larger file and slower xatlas UV unwrapping',
			},
			{
				displayName: 'Sparse Structure Steps',
				name: 'ss_steps',
				type: 'number',
				default: 0,
				description: 'Diffusion steps for sparse structure (coarse 3D skeleton); more steps = better quality but slower',
			},
			{
				displayName: 'Sparse Structure Guidance Strength',
				name: 'ss_guidance_strength',
				type: 'number',
				default: 0,
				description: 'CFG strength for sparse structure; higher = more faithful to input image but may cause artifacts',
			},
			{
				displayName: 'Sparse Structure Guidance Rescale',
				name: 'ss_guidance_rescale',
				type: 'number',
				default: 0,
				description: 'Corrects over-saturation from high CFG; 0 = off, 1 = full correction',
			},
			{
				displayName: 'Sparse Structure Rescale T',
				name: 'ss_rescale_t',
				type: 'number',
				default: 0,
				description: 'Timestep rescale for sparse structure; higher allocates more time to early (coarse) steps',
			},
			{
				displayName: 'Shape Slat Steps',
				name: 'shape_steps',
				type: 'number',
				default: 0,
				description: 'Diffusion steps for detailed 3D geometry; directly affects shape detail quality',
			},
			{
				displayName: 'Shape Slat Strength',
				name: 'shape_guidance_strength',
				type: 'number',
				default: 0,
				description: 'CFG strength for shape generation; controls how closely geometry follows the input image',
			},
			{
				displayName: 'Shape Slat Rescale',
				name: 'shape_guidance_rescale',
				type: 'number',
				default: 0,
				description: 'CFG rescale for shape; slightly lower than sparse structure for more natural geometry',
			},
			{
				displayName: 'Shape Slat Rescale T',
				name: 'shape_rescale_t',
				type: 'number',
				default: 0,
				description: 'Timestep rescale for shape generation; lower than sparse structure for more uniform step distribution',
			},
			{
				displayName: 'Tex Slat Steps',
				name: 'tex_steps',
				type: 'number',
				default: 0,
				description: 'Diffusion steps for PBR texture generation; directly affects texture quality',
			},
			{
				displayName: 'Tex Slat Guidance Strength',
				name: 'tex_guidance_strength',
				type: 'number',
				default: 0,
				description: 'CFG strength for texture; default 1.0 means no guidance (texture generation usually works best unguided)',
			},
			{
				displayName: 'Tex Slat Guidance Rescale',
				name: 'tex_guidance_rescale',
				type: 'number',
				default: 0,
				description: 'CFG rescale for texture; default 0 = off since guidance strength is already 1.0',
			},
			{
				displayName: 'Tex Slat Rescale T',
				name: 'tex_rescale_t',
				type: 'number',
				default: 0,
				description: 'Timestep rescale for texture generation',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0) as string;
		const pipeline_type = this.getNodeParameter('pipeline_type', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const texture_size = this.getNodeParameter('texture_size', 0, '') as string;
		const decimation_target = this.getNodeParameter('decimation_target', 0, 0) as number;
		const ss_steps = this.getNodeParameter('ss_steps', 0, 0) as number;
		const ss_guidance_strength = this.getNodeParameter('ss_guidance_strength', 0, 0) as number;
		const ss_guidance_rescale = this.getNodeParameter('ss_guidance_rescale', 0, 0) as number;
		const ss_rescale_t = this.getNodeParameter('ss_rescale_t', 0, 0) as number;
		const shape_steps = this.getNodeParameter('shape_steps', 0, 0) as number;
		const shape_guidance_strength = this.getNodeParameter('shape_guidance_strength', 0, 0) as number;
		const shape_guidance_rescale = this.getNodeParameter('shape_guidance_rescale', 0, 0) as number;
		const shape_rescale_t = this.getNodeParameter('shape_rescale_t', 0, 0) as number;
		const tex_steps = this.getNodeParameter('tex_steps', 0, 0) as number;
		const tex_guidance_strength = this.getNodeParameter('tex_guidance_strength', 0, 0) as number;
		const tex_guidance_rescale = this.getNodeParameter('tex_guidance_rescale', 0, 0) as number;
		const tex_rescale_t = this.getNodeParameter('tex_rescale_t', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/microsoft/Trellis-2',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputImageUrl,
				pipeline_type,
				seed,
				texture_size,
				decimation_target,
				ss_steps,
				ss_guidance_strength,
				ss_guidance_rescale,
				ss_rescale_t,
				shape_steps,
				shape_guidance_strength,
				shape_guidance_rescale,
				shape_rescale_t,
				tex_steps,
				tex_guidance_strength,
				tex_guidance_rescale,
				tex_rescale_t,
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
