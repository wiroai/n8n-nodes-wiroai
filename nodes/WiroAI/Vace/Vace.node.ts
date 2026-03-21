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

export class Vace implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Vace',
		name: 'vace',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Vace powered by Pruna AI',
		defaults: {
			name: 'Wiro - Vace',
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
				required: true,
				description: 'Text input for prompt',
			},
			{
				displayName: 'Images URL',
				name: 'inputImageUrl',
				type: 'string',
				default: '',
				description: 'Optional. Use 1-3 clear, high-quality images for character consistency.',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '480p',
				description: 'Select option for resolution',
				options: [
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
				],
			},
			{
				displayName: 'Aspect Ratio',
				name: 'ratio',
				type: 'options',
				default: '16:9',
				description: 'Auto will calculate from reference image, if no image provided it will set 16:9 by default',
				options: [
					{ name: '16:9 (Landscape)', value: '16:9' },
					{ name: '9:16 (Portrait)', value: '9:16' },
					{ name: 'Auto (From Image)', value: 'auto' },
				],
			},
			{
				displayName: 'Frame Number',
				name: 'frameNum',
				type: 'string',
				default: '',
				description: 'Number of frames to generate',
			},
			{
				displayName: 'Speed Mode',
				name: 'speedMode',
				type: 'options',
				default: 'Extra Juiced 🚀 (even more speed)',
				description: 'Balance between speed and quality',
				options: [
					{ name: 'Extra Juiced 🚀 (Fastest)', value: 'Extra Juiced 🚀 (even more speed)' },
					{ name: 'Juiced 🔥 (Balanced)', value: 'Juiced 🔥 (more speed)' },
					{ name: 'Lightly Juiced 🍊 (Best Quality)', value: 'Lightly Juiced 🍊 (more consistent)' },
				],
			},
			{
				displayName: 'Sample Steps',
				name: 'sampleSteps',
				type: 'string',
				default: '',
				description: 'Higher values = better quality, slower generation',
			},
			{
				displayName: 'Sample Solver',
				name: 'sampleSolver',
				type: 'options',
				default: 'dpm++',
				description: 'Sampling algorithm',
				options: [
					{ name: 'DPM++', value: 'dpm++' },
					{ name: 'UniPC', value: 'unipc' },
				],
			},
			{
				displayName: 'Guidance Scale',
				name: 'guidanceScale',
				type: 'string',
				default: '',
				description: 'How closely to follow the prompt (higher = stricter)',
			},
			{
				displayName: 'Sample Shift',
				name: 'sampleShift',
				type: 'string',
				default: '',
				description: 'Sample shift parameter for fine-tuning',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Random seed for reproducibility. Use 0 for random seed.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const prompt = this.getNodeParameter('prompt', 0) as string;
		const inputImageUrl = this.getNodeParameter('inputImageUrl', 0, '') as string;
		const resolution = this.getNodeParameter('resolution', 0, '') as string;
		const ratio = this.getNodeParameter('ratio', 0, '') as string;
		const frameNum = this.getNodeParameter('frameNum', 0, '') as string;
		const speedMode = this.getNodeParameter('speedMode', 0, '') as string;
		const sampleSteps = this.getNodeParameter('sampleSteps', 0, '') as string;
		const sampleSolver = this.getNodeParameter('sampleSolver', 0, '') as string;
		const guidanceScale = this.getNodeParameter('guidanceScale', 0, '') as string;
		const sampleShift = this.getNodeParameter('sampleShift', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/pruna/vace',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				prompt,
				inputImageUrl,
				resolution,
				ratio,
				frameNum,
				speedMode,
				sampleSteps,
				sampleSolver,
				guidanceScale,
				sampleShift,
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
