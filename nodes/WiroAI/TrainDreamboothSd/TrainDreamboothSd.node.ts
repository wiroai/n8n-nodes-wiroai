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

export class TrainDreamboothSd implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Train Dreambooth Sd',
		name: 'trainDreamboothSd',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Train your own custom Stable Diffusion model using a small set of images',
		defaults: {
			name: 'Wiro - Train Dreambooth Sd',
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
				displayName: 'Trained Model Name',
				name: 'trainModelName',
				type: 'string',
				default: '',
				required: true,
				description: 'Train-model-name-help',
			},
			{
				displayName: 'Train Model Description',
				name: 'trainModelDescription',
				type: 'string',
				default: '',
				description: 'Train-model-description-help',
			},
			{
				displayName: 'Reference Model',
				name: 'referenceModel',
				type: 'options',
				default: '',
				description: 'Reference-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Reference Model Private',
				name: 'referenceModelPrivate',
				type: 'options',
				default: '',
				description: 'Reference-model-private-help',
				options: [
				],
			},
			{
				displayName: 'Classification Dataset',
				name: 'classificationDataSet',
				type: 'string',
				default: '',
				required: true,
				description: 'Classification-dataset-help',
			},
			{
				displayName: 'Instance Prompt',
				name: 'instancePrompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Instance-prompt-help',
			},
			{
				displayName: 'Class Prompt',
				name: 'classPrompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Class-prompt-help',
			},
			{
				displayName: 'Save Sample Prompt',
				name: 'saveSamplePrompt',
				type: 'string',
				default: '',
				description: 'Save-sample-prompt-help',
			},
			{
				displayName: 'Save Sample Negative Prompt',
				name: 'saveSampleNegativePrompt',
				type: 'string',
				default: '',
				description: 'Save-sample-negative-prompt-help',
			},
			{
				displayName: 'Class Images',
				name: 'classImages',
				type: 'number',
				default: 0,
				required: true,
				description: 'Class-images-help',
			},
			{
				displayName: 'N Save Sample',
				name: 'nSaveSample',
				type: 'number',
				default: 0,
				required: true,
				description: 'N-save-sample-help',
			},
			{
				displayName: 'Save Guidance Scale',
				name: 'saveGuidanceScale',
				type: 'number',
				default: 0,
				required: true,
				description: 'Save-guidance-scale-help',
			},
			{
				displayName: 'Save Infer Steps',
				name: 'saveInferSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Save-infer-steps-help',
			},
			{
				displayName: 'Pad Tokens',
				name: 'padTokens',
				type: 'boolean',
				default: false,
				description: 'Whether to enable pad-tokens-help',
			},
			{
				displayName: 'With Prior Preservation',
				name: 'withPriorPreservation',
				type: 'boolean',
				default: false,
				description: 'Whether to enable with-prior-preservation-help',
			},
			{
				displayName: 'Prior Loss Weight',
				name: 'priorLossWeight',
				type: 'number',
				default: 0,
				required: true,
				description: 'Prior-loss-weight-help',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				required: true,
				description: 'Seed-help',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1024',
				required: true,
				description: 'Resolution-help',
				options: [
					{ name: '1024', value: '1024' },
					{ name: '2048', value: '2048' },
					{ name: '512', value: '512' },
				],
			},
			{
				displayName: 'Center Crop',
				name: 'centerCrop',
				type: 'boolean',
				default: false,
				description: 'Whether to enable center-crop-help',
			},
			{
				displayName: 'Train Text Encoder',
				name: 'trainTextEncoder',
				type: 'boolean',
				default: false,
				description: 'Whether to enable train-text-encoder-help',
			},
			{
				displayName: 'Train Batch Size',
				name: 'trainBatchSize',
				type: 'number',
				default: 0,
				required: true,
				description: 'Train-batch-size-help',
			},
			{
				displayName: 'Sample Batch Size',
				name: 'sampleBatchSize',
				type: 'number',
				default: 0,
				required: true,
				description: 'Sample-batch-size-help',
			},
			{
				displayName: 'Training Steps',
				name: 'trainingSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Training-steps-help',
			},
			{
				displayName: 'Gradient Accumulation Steps',
				name: 'gradientAccumulationSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Gradient-accumulation-steps-help',
			},
			{
				displayName: 'Gradient Checkpointing',
				name: 'gradientCheckpointing',
				type: 'boolean',
				default: false,
				description: 'Whether to enable gradient-checkpointing-help',
			},
			{
				displayName: 'Learning Rate',
				name: 'learningRate',
				type: 'number',
				default: 0,
				required: true,
				description: 'Learning-rate-help',
			},
			{
				displayName: 'Scale Lr',
				name: 'scaleLR',
				type: 'boolean',
				default: false,
				description: 'Whether to enable scale-lr-help',
			},
			{
				displayName: 'Lr Scheduler',
				name: 'lrScheduler',
				type: 'options',
				default: 'constant',
				required: true,
				description: 'Lr-scheduler-help',
				options: [
					{ name: 'Constant', value: 'constant' },
					{ name: 'Constant With Warmup', value: 'constant_with_warmup' },
					{ name: 'Cosine', value: 'cosine' },
					{ name: 'Cosine With Restarts', value: 'cosine_with_restarts' },
					{ name: 'Linear', value: 'linear' },
					{ name: 'Polynomial', value: 'polynomial' },
				],
			},
			{
				displayName: 'Lr Warm Up Steps',
				name: 'lrWarmUpSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Lr-warm-up-steps-help',
			},
			{
				displayName: 'Use 8bit Adam',
				name: 'use8BitAdam',
				type: 'boolean',
				default: false,
				description: 'Whether to enable use-8bit-adam-help',
			},
			{
				displayName: 'Adam Beta1',
				name: 'adamBeta1',
				type: 'number',
				default: 0,
				required: true,
				description: 'Adam-beta1-help',
			},
			{
				displayName: 'Adam Beta2',
				name: 'adamBeta2',
				type: 'number',
				default: 0,
				required: true,
				description: 'Adam-beta2-help',
			},
			{
				displayName: 'Adam Weight Decay',
				name: 'adamWeightDecay',
				type: 'number',
				default: 0,
				required: true,
				description: 'Adam-weight-decay-help',
			},
			{
				displayName: 'Adam Epsilon',
				name: 'adamEpsilon',
				type: 'number',
				default: 0,
				required: true,
				description: 'Adam-epsilon-help',
			},
			{
				displayName: 'Max Grad Norm',
				name: 'maxGradNorm',
				type: 'number',
				default: 0,
				required: true,
				description: 'Max-grad-norm-help',
			},
			{
				displayName: 'Save Interval',
				name: 'saveInterval',
				type: 'number',
				default: 0,
				required: true,
				description: 'Save-interval-help',
			},
			{
				displayName: 'Save Min Steps',
				name: 'saveMinSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Save-min-steps-help',
			},
			{
				displayName: 'Mixed Precision',
				name: 'mixedPrecision',
				type: 'options',
				default: 'bf16',
				required: true,
				description: 'Mixed-precision-help',
				options: [
					{ name: 'Bf16', value: 'bf16' },
					{ name: 'Fp16', value: 'fp16' },
					{ name: 'No', value: 'no' },
				],
			},
			{
				displayName: 'Selected Folder For Train Data',
				name: 'selectedFolder',
				type: 'string',
				default: '',
				description: 'Value for selected folder for train data',
			},
			{
				displayName: 'ZIP URL For Training Data',
				name: 'selectedFolderUrl',
				type: 'string',
				default: '',
				description: 'When a ZIP URL is provided, it is automatically extracted and used as the training folder',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const trainModelName = this.getNodeParameter('trainModelName', 0) as string;
		const trainModelDescription = this.getNodeParameter('trainModelDescription', 0, '') as string;
		const referenceModel = this.getNodeParameter('referenceModel', 0, '') as string;
		const referenceModelPrivate = this.getNodeParameter('referenceModelPrivate', 0, '') as string;
		const classificationDataSet = this.getNodeParameter('classificationDataSet', 0) as string;
		const instancePrompt = this.getNodeParameter('instancePrompt', 0) as string;
		const classPrompt = this.getNodeParameter('classPrompt', 0) as string;
		const saveSamplePrompt = this.getNodeParameter('saveSamplePrompt', 0, '') as string;
		const saveSampleNegativePrompt = this.getNodeParameter('saveSampleNegativePrompt', 0, '') as string;
		const classImages = this.getNodeParameter('classImages', 0) as number;
		const nSaveSample = this.getNodeParameter('nSaveSample', 0) as number;
		const saveGuidanceScale = this.getNodeParameter('saveGuidanceScale', 0) as number;
		const saveInferSteps = this.getNodeParameter('saveInferSteps', 0) as number;
		const padTokens = this.getNodeParameter('padTokens', 0, false) as boolean;
		const withPriorPreservation = this.getNodeParameter('withPriorPreservation', 0, false) as boolean;
		const priorLossWeight = this.getNodeParameter('priorLossWeight', 0) as number;
		const seed = this.getNodeParameter('seed', 0) as string;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const centerCrop = this.getNodeParameter('centerCrop', 0, false) as boolean;
		const trainTextEncoder = this.getNodeParameter('trainTextEncoder', 0, false) as boolean;
		const trainBatchSize = this.getNodeParameter('trainBatchSize', 0) as number;
		const sampleBatchSize = this.getNodeParameter('sampleBatchSize', 0) as number;
		const trainingSteps = this.getNodeParameter('trainingSteps', 0) as number;
		const gradientAccumulationSteps = this.getNodeParameter('gradientAccumulationSteps', 0) as number;
		const gradientCheckpointing = this.getNodeParameter('gradientCheckpointing', 0, false) as boolean;
		const learningRate = this.getNodeParameter('learningRate', 0) as number;
		const scaleLR = this.getNodeParameter('scaleLR', 0, false) as boolean;
		const lrScheduler = this.getNodeParameter('lrScheduler', 0) as string;
		const lrWarmUpSteps = this.getNodeParameter('lrWarmUpSteps', 0) as number;
		const use8BitAdam = this.getNodeParameter('use8BitAdam', 0, false) as boolean;
		const adamBeta1 = this.getNodeParameter('adamBeta1', 0) as number;
		const adamBeta2 = this.getNodeParameter('adamBeta2', 0) as number;
		const adamWeightDecay = this.getNodeParameter('adamWeightDecay', 0) as number;
		const adamEpsilon = this.getNodeParameter('adamEpsilon', 0) as number;
		const maxGradNorm = this.getNodeParameter('maxGradNorm', 0) as number;
		const saveInterval = this.getNodeParameter('saveInterval', 0) as number;
		const saveMinSteps = this.getNodeParameter('saveMinSteps', 0) as number;
		const mixedPrecision = this.getNodeParameter('mixedPrecision', 0) as string;
		const selectedFolder = this.getNodeParameter('selectedFolder', 0, '') as string;
		const selectedFolderUrl = this.getNodeParameter('selectedFolderUrl', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/train-dreambooth-sd',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				trainModelName,
				trainModelDescription,
				referenceModel,
				referenceModelPrivate,
				classificationDataSet,
				instancePrompt,
				classPrompt,
				saveSamplePrompt,
				saveSampleNegativePrompt,
				classImages,
				nSaveSample,
				saveGuidanceScale,
				saveInferSteps,
				padTokens,
				withPriorPreservation,
				priorLossWeight,
				seed,
				resolution,
				centerCrop,
				trainTextEncoder,
				trainBatchSize,
				sampleBatchSize,
				trainingSteps,
				gradientAccumulationSteps,
				gradientCheckpointing,
				learningRate,
				scaleLR,
				lrScheduler,
				lrWarmUpSteps,
				use8BitAdam,
				adamBeta1,
				adamBeta2,
				adamWeightDecay,
				adamEpsilon,
				maxGradNorm,
				saveInterval,
				saveMinSteps,
				mixedPrecision,
				selectedFolder,
				selectedFolderUrl,
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
