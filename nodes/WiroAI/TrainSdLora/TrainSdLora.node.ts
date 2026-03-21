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

export class TrainSdLora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Train Sd Lora',
		name: 'trainSdLora',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'LoRA training is a low-rank adaptation technique used to fine-tune Stable Diffusion (SD) models',
		defaults: {
			name: 'Wiro - Train Sd Lora',
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
				displayName: 'Validation Prompt',
				name: 'validationPrompt',
				type: 'string',
				default: '',
				description: 'Validation-prompt-help',
			},
			{
				displayName: 'Validation Negative Prompt',
				name: 'validationNegativePrompt',
				type: 'string',
				default: '',
				description: 'Validation-negative-prompt-help',
			},
			{
				displayName: 'Num Validation Images',
				name: 'numValidationImages',
				type: 'number',
				default: 0,
				required: true,
				description: 'Num-validation-images-help',
			},
			{
				displayName: 'Num Class Images',
				name: 'numClassImages',
				type: 'number',
				default: 0,
				required: true,
				description: 'Num-class-images-help',
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
					{ name: '768', value: '768' },
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
				displayName: 'Lr Num Cycles',
				name: 'lrNumCycles',
				type: 'number',
				default: 0,
				required: true,
				description: 'Lr-num-cycles-help',
			},
			{
				displayName: 'Lr Power',
				name: 'lrPower',
				type: 'number',
				default: 0,
				required: true,
				description: 'Lr-power-help',
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
				displayName: 'Checkpointing Steps',
				name: 'checkpointingSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Checkpointing-steps-help',
			},
			{
				displayName: 'Checkpoints Total Limit',
				name: 'checkpointsTotalLimit',
				type: 'number',
				default: 0,
				required: true,
				description: 'Checkpoints-total-limit-help',
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
				displayName: 'Prior Generation Precision',
				name: 'priorGenerationPrecision',
				type: 'options',
				default: 'bf16',
				required: true,
				description: 'Mixed-precision-help',
				options: [
					{ name: 'Bf16', value: 'bf16' },
					{ name: 'Fp16', value: 'fp16' },
					{ name: 'Fp32', value: 'fp32' },
					{ name: 'No', value: 'no' },
				],
			},
			{
				displayName: 'Lora Rank',
				name: 'loraRank',
				type: 'number',
				default: 0,
				required: true,
				description: 'Lora-rank-help',
			},
			{
				displayName: 'Allowtf32',
				name: 'allowtf32',
				type: 'boolean',
				default: false,
				description: 'Whether to enable allowtf32-help',
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
		const validationPrompt = this.getNodeParameter('validationPrompt', 0, '') as string;
		const validationNegativePrompt = this.getNodeParameter('validationNegativePrompt', 0, '') as string;
		const numValidationImages = this.getNodeParameter('numValidationImages', 0) as number;
		const numClassImages = this.getNodeParameter('numClassImages', 0) as number;
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
		const lrNumCycles = this.getNodeParameter('lrNumCycles', 0) as number;
		const lrPower = this.getNodeParameter('lrPower', 0) as number;
		const use8BitAdam = this.getNodeParameter('use8BitAdam', 0, false) as boolean;
		const adamBeta1 = this.getNodeParameter('adamBeta1', 0) as number;
		const adamBeta2 = this.getNodeParameter('adamBeta2', 0) as number;
		const adamWeightDecay = this.getNodeParameter('adamWeightDecay', 0) as number;
		const adamEpsilon = this.getNodeParameter('adamEpsilon', 0) as number;
		const maxGradNorm = this.getNodeParameter('maxGradNorm', 0) as number;
		const checkpointingSteps = this.getNodeParameter('checkpointingSteps', 0) as number;
		const checkpointsTotalLimit = this.getNodeParameter('checkpointsTotalLimit', 0) as number;
		const mixedPrecision = this.getNodeParameter('mixedPrecision', 0) as string;
		const priorGenerationPrecision = this.getNodeParameter('priorGenerationPrecision', 0) as string;
		const loraRank = this.getNodeParameter('loraRank', 0) as number;
		const allowtf32 = this.getNodeParameter('allowtf32', 0, false) as boolean;
		const selectedFolder = this.getNodeParameter('selectedFolder', 0, '') as string;
		const selectedFolderUrl = this.getNodeParameter('selectedFolderUrl', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/train-sd-lora',
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
				validationPrompt,
				validationNegativePrompt,
				numValidationImages,
				numClassImages,
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
				lrNumCycles,
				lrPower,
				use8BitAdam,
				adamBeta1,
				adamBeta2,
				adamWeightDecay,
				adamEpsilon,
				maxGradNorm,
				checkpointingSteps,
				checkpointsTotalLimit,
				mixedPrecision,
				priorGenerationPrecision,
				loraRank,
				allowtf32,
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
