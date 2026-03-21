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

export class NoiseReduction implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Noise Reduction',
		name: 'noiseReduction',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Noise reduction algorithm that reduces noise in time-domain signals like speech, bioacoustics,',
		defaults: {
			name: 'Wiro - Noise Reduction',
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
				displayName: 'Input Audio URL',
				name: 'inputAudioUrl',
				type: 'string',
				default: '',
				description: 'Input-audio-help',
			},
			{
				displayName: 'Sample Rate',
				name: 'sampleRate',
				type: 'options',
				default: '11025',
				required: true,
				description: 'Sample-rate-help',
				options: [
					{ name: '11,025', value: '11025' },
					{ name: '16,000', value: '16000' },
					{ name: '176,400', value: '176400' },
					{ name: '192,000', value: '192000' },
					{ name: '22,050', value: '22050' },
					{ name: '352,800', value: '352800' },
					{ name: '384,000', value: '384000' },
					{ name: '44,100', value: '44100' },
					{ name: '48,000', value: '48000' },
					{ name: '8,000', value: '8000' },
					{ name: '88,200', value: '88200' },
					{ name: '96,000', value: '96000' },
				],
			},
			{
				displayName: 'Spectral Gating',
				name: 'spectralGating',
				type: 'boolean',
				default: false,
				description: 'Whether to enable spectral-gating-help',
			},
			{
				displayName: 'Pcen',
				name: 'pcen',
				type: 'boolean',
				default: false,
				description: 'Whether to enable pcen-help',
			},
			{
				displayName: 'Highpass Filter',
				name: 'highpassFilter',
				type: 'boolean',
				default: false,
				description: 'Whether to enable highpass-filter-help',
			},
			{
				displayName: 'Combine Spectral Pcen',
				name: 'combineSpectralPcen',
				type: 'boolean',
				default: false,
				description: 'Whether to enable combine-spectral-pcen-help',
			},
			{
				displayName: 'Combine Spectral Highpass',
				name: 'combineSpectralHighpass',
				type: 'boolean',
				default: false,
				description: 'Whether to enable combine-spectral-highpass-help',
			},
			{
				displayName: 'Combine All',
				name: 'combineAll',
				type: 'boolean',
				default: false,
				description: 'Whether to enable combine-all-help',
			},
			{
				displayName: 'N Grad Freq',
				name: 'nGradFreq',
				type: 'number',
				default: 0,
				description: 'N-grad-freq-help',
			},
			{
				displayName: 'N Grad Time',
				name: 'nGradTime',
				type: 'number',
				default: 0,
				description: 'N-grad-time-help',
			},
			{
				displayName: 'N Ftt',
				name: 'nFtt',
				type: 'number',
				default: 0,
				description: 'N-ftt-help',
			},
			{
				displayName: 'Win Length',
				name: 'winLength',
				type: 'number',
				default: 0,
				description: 'Win-length-help',
			},
			{
				displayName: 'N Std Thresh',
				name: 'nStdThresh',
				type: 'number',
				default: 0,
				description: 'N-std-thresh-help',
			},
			{
				displayName: 'Prop Decrease',
				name: 'propDecrease',
				type: 'number',
				default: 0,
				description: 'Prop-decrease-help',
			},
			{
				displayName: 'Gain',
				name: 'gain',
				type: 'number',
				default: 0,
				description: 'Gain-help',
			},
			{
				displayName: 'Bias',
				name: 'bias',
				type: 'number',
				default: 0,
				description: 'Bias-help',
			},
			{
				displayName: 'Power',
				name: 'power',
				type: 'number',
				default: 0,
				description: 'Power-help',
			},
			{
				displayName: 'Time Constant',
				name: 'timeConstant',
				type: 'number',
				default: 0,
				description: 'Time-constant-help',
			},
			{
				displayName: 'Eps',
				name: 'eps',
				type: 'number',
				default: 0,
				description: 'Eps-help',
			},
			{
				displayName: 'Max Size',
				name: 'maxSize',
				type: 'number',
				default: 0,
				description: 'Max-size-help',
			},
			{
				displayName: 'Hop Length',
				name: 'hopLength',
				type: 'number',
				default: 0,
				description: 'Hop-length-help',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const inputAudioUrl = this.getNodeParameter('inputAudioUrl', 0, '') as string;
		const sampleRate = this.getNodeParameter('sampleRate', 0) as string;
		const spectralGating = this.getNodeParameter('spectralGating', 0, false) as boolean;
		const pcen = this.getNodeParameter('pcen', 0, false) as boolean;
		const highpassFilter = this.getNodeParameter('highpassFilter', 0, false) as boolean;
		const combineSpectralPcen = this.getNodeParameter('combineSpectralPcen', 0, false) as boolean;
		const combineSpectralHighpass = this.getNodeParameter('combineSpectralHighpass', 0, false) as boolean;
		const combineAll = this.getNodeParameter('combineAll', 0, false) as boolean;
		const nGradFreq = this.getNodeParameter('nGradFreq', 0, 0) as number;
		const nGradTime = this.getNodeParameter('nGradTime', 0, 0) as number;
		const nFtt = this.getNodeParameter('nFtt', 0, 0) as number;
		const winLength = this.getNodeParameter('winLength', 0, 0) as number;
		const nStdThresh = this.getNodeParameter('nStdThresh', 0, 0) as number;
		const propDecrease = this.getNodeParameter('propDecrease', 0, 0) as number;
		const gain = this.getNodeParameter('gain', 0, 0) as number;
		const bias = this.getNodeParameter('bias', 0, 0) as number;
		const power = this.getNodeParameter('power', 0, 0) as number;
		const timeConstant = this.getNodeParameter('timeConstant', 0, 0) as number;
		const eps = this.getNodeParameter('eps', 0, 0) as number;
		const maxSize = this.getNodeParameter('maxSize', 0, 0) as number;
		const hopLength = this.getNodeParameter('hopLength', 0, 0) as number;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/librosa/noise-reduction',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				inputAudioUrl,
				sampleRate,
				spectralGating,
				pcen,
				highpassFilter,
				combineSpectralPcen,
				combineSpectralHighpass,
				combineAll,
				nGradFreq,
				nGradTime,
				nFtt,
				winLength,
				nStdThresh,
				propDecrease,
				gain,
				bias,
				power,
				timeConstant,
				eps,
				maxSize,
				hopLength,
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
