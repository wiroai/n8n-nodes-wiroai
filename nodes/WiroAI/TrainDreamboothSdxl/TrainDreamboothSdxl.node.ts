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

export class TrainDreamboothSdxl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Train Dreambooth Sdxl',
		name: 'trainDreamboothSdxl',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Train your own custom Stable Diffusion XL model using a small set of images',
		defaults: {
			name: 'Wiro - Train Dreambooth Sdxl',
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
				name: 'save_sample_prompt',
				type: 'string',
				default: '',
				description: 'Save_sample_prompt-help',
			},
			{
				displayName: 'Learning Rate',
				name: 'learning_rate',
				type: 'number',
				default: 0,
				required: true,
				description: 'Specifies the learning rate, which controls the speed of model updates',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				default: '1024',
				required: true,
				description: 'Specifies the image resolution used during training',
				options: [
					{ name: '1024', value: '1024' },
					{ name: '2048', value: '2048' },
					{ name: '512', value: '512' },
				],
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
				displayName: 'Max Train Steps',
				name: 'max_train_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'The maximum number of training steps',
			},
			{
				displayName: 'Save Every N Steps',
				name: 'save_every_n_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Saves the model at specified step intervals',
			},
			{
				displayName: 'Gradient Checkpointing',
				name: 'gradient_checkpointing',
				type: 'boolean',
				default: false,
				description: 'Whether Use Gradient Checkpointing or Not',
			},
			{
				displayName: 'Train Text Encoder',
				name: 'train_text_encoder',
				type: 'boolean',
				default: false,
				description: 'Whether to enable determines whether the text encoder is trained',
			},
			{
				displayName: 'Full Bf16',
				name: 'full_bf16',
				type: 'boolean',
				default: false,
				description: 'Whether to enable enables full bf16 precision for efficient memory usage',
			},
			{
				displayName: 'Full Fp16',
				name: 'full_fp16',
				type: 'boolean',
				default: false,
				description: 'Whether to enable enables full fp16 precision for efficient memory usage',
			},
			{
				displayName: 'Train Batch Size',
				name: 'train_batch_size',
				type: 'number',
				default: 0,
				required: true,
				description: 'Batch Size Of The Training Data',
			},
			{
				displayName: 'Sample Sampler',
				name: 'sample_sampler',
				type: 'options',
				default: 'ddim',
				required: true,
				description: 'Sampler For Samples',
				options: [
					{ name: 'Ddim', value: 'ddim' },
					{ name: 'Dpm 2', value: 'dpm_2' },
					{ name: 'Dpm 2 A', value: 'dpm_2_a' },
					{ name: 'Dpmsingle', value: 'dpmsingle' },
					{ name: 'Dpmsolver', value: 'dpmsolver' },
					{ name: 'Dpmsolver++', value: 'dpmsolver++' },
					{ name: 'Euler', value: 'euler' },
					{ name: 'Euler A', value: 'euler_a' },
					{ name: 'Heun', value: 'heun' },
					{ name: 'K Dpm 2', value: 'k_dpm_2' },
					{ name: 'K Dpm 2 A', value: 'k_dpm_2_a' },
					{ name: 'K Euler', value: 'k_euler' },
					{ name: 'K Euler A', value: 'k_euler_a' },
					{ name: 'K Lms', value: 'k_lms' },
					{ name: 'Lms', value: 'lms' },
					{ name: 'Pndm', value: 'pndm' },
				],
			},
			{
				displayName: 'Cache Latents',
				name: 'cache_latents',
				type: 'boolean',
				default: false,
				description: 'Whether to enable enables caching of latent space representations to speed up training',
			},
			{
				displayName: 'Cache Latents To Disk',
				name: 'cache_latents_to_disk',
				type: 'boolean',
				default: false,
				description: 'Whether to enable saves latent data to disk to reduce ram usage. (cant use when cache latents not enabled).',
			},
			{
				displayName: 'Mem Eff Attn',
				name: 'mem_eff_attn',
				type: 'boolean',
				default: false,
				description: 'Whether mem_eff_attn or Not',
			},
			{
				displayName: 'Xformers',
				name: 'xformers',
				type: 'boolean',
				default: false,
				description: 'Whether to enable utilizes the xformers library for memory optimization and speed',
			},
			{
				displayName: 'Use 8bit Adam',
				name: 'use_8bit_adam',
				type: 'boolean',
				default: false,
				description: 'Whether to enable uses 8-bit adam optimizer for better memory efficiency',
			},
			{
				displayName: 'Enable Bucket',
				name: 'enable_bucket',
				type: 'boolean',
				default: false,
				description: 'Whether to enable enable buckets for multi aspect ratio training',
			},
			{
				displayName: 'Lr Scheduler',
				name: 'lr_scheduler',
				type: 'options',
				default: 'adafactor',
				required: true,
				description: 'Determines how the learning rate changes over time',
				options: [
					{ name: 'Adafactor', value: 'adafactor' },
					{ name: 'Constant', value: 'constant' },
					{ name: 'Constant With Warmup', value: 'constant_with_warmup' },
					{ name: 'Cosine', value: 'cosine' },
					{ name: 'Cosine With Restarts', value: 'cosine_with_restarts' },
					{ name: 'Linear', value: 'linear' },
					{ name: 'Polynomial', value: 'polynomial' },
				],
			},
			{
				displayName: 'Lr Scheduler Num Cycles',
				name: 'lr_scheduler_num_cycles',
				type: 'number',
				default: 0,
				required: true,
				description: 'Number of cycles for the learning rate schedule',
			},
			{
				displayName: 'Gradient Accumulation Steps',
				name: 'gradient_accumulation_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Accumulates gradients over multiple steps to simulate a larger batch size',
			},
			{
				displayName: 'Max Grad Norm',
				name: 'max_grad_norm',
				type: 'number',
				default: 0,
				description: 'Limits gradient values to prevent explosion',
			},
			{
				displayName: 'Mixed Precision',
				name: 'mixed_precision',
				type: 'options',
				default: 'bf16',
				required: true,
				description: 'Specifies the precision used during training',
				options: [
					{ name: 'Bf16', value: 'bf16' },
					{ name: 'Fp16', value: 'fp16' },
					{ name: 'No', value: 'no' },
				],
			},
			{
				displayName: 'Save Precision',
				name: 'save_precision',
				type: 'options',
				default: 'bf16',
				required: true,
				description: 'Determines the precision level for saving the model',
				options: [
					{ name: 'Bf16', value: 'bf16' },
					{ name: 'Float', value: 'float' },
					{ name: 'Fp16', value: 'fp16' },
					{ name: 'None', value: '' },
				],
			},
			{
				displayName: 'Save Every N Epochs',
				name: 'save_every_n_epochs',
				type: 'number',
				default: 0,
				required: true,
				description: 'Saves the model at specified epoch intervals',
			},
			{
				displayName: 'Optimizer Type',
				name: 'optimizer_type',
				type: 'options',
				default: 'AdaFactor',
				required: true,
				description: 'The optimizer algorithm used for training',
				options: [
					{ name: 'AdaFactor', value: 'AdaFactor' },
					{ name: 'AdamW', value: 'AdamW' },
					{ name: 'AdamW8bit', value: 'AdamW8bit' },
					{ name: 'DAdaptAdaGrad', value: 'DAdaptAdaGrad' },
					{ name: 'DAdaptAdam', value: 'DAdaptAdam' },
					{ name: 'DAdaptAdan', value: 'DAdaptAdan' },
					{ name: 'DAdaptAdanIP', value: 'DAdaptAdanIP' },
					{ name: 'DAdaptation(DAdaptAdamPreprint)', value: 'DAdaptation(DAdaptAdamPreprint)' },
					{ name: 'DAdaptLion', value: 'DAdaptLion' },
					{ name: 'DAdaptSGD', value: 'DAdaptSGD' },
					{ name: 'Lion', value: 'Lion' },
					{ name: 'Lion8bit', value: 'Lion8bit' },
					{ name: 'PagedAdamW8bit', value: 'PagedAdamW8bit' },
					{ name: 'PagedLion8bit', value: 'PagedLion8bit' },
					{ name: 'SGDNesterov', value: 'SGDNesterov' },
					{ name: 'SGDNesterov8bit', value: 'SGDNesterov8bit' },
				],
			},
			{
				displayName: 'Optimizer Args',
				name: 'optimizer_args',
				type: 'string',
				default: '',
				description: 'Additional optimizer arguments such as weight_decay and betas',
			},
			{
				displayName: 'Bucket Reso Steps',
				name: 'bucket_reso_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Specifies the step size for resolution bucketing',
			},
			{
				displayName: 'Noise Offset',
				name: 'noise_offset',
				type: 'number',
				default: 0,
				required: true,
				description: 'Adds noise during training to improve generalization',
			},
			{
				displayName: 'Bucket No Upscale',
				name: 'bucket_no_upscale',
				type: 'boolean',
				default: false,
				description: 'Whether to enable images are upscaled during bucketing',
			},
			{
				displayName: 'Sample Every N Epochs',
				name: 'sample_every_n_epochs',
				type: 'number',
				default: 0,
				required: true,
				description: 'Generates sample outputs every specified number of epochs',
			},
			{
				displayName: 'Sample Every N Steps',
				name: 'sample_every_n_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'Generates sample outputs every specified number of steps',
			},
			{
				displayName: 'Num Of Repeats',
				name: 'num_of_repeats',
				type: 'number',
				default: 0,
				required: true,
				description: 'Number of times each training image is repeated during training',
			},
			{
				displayName: 'Cache Info',
				name: 'cache_info',
				type: 'boolean',
				default: false,
				description: 'Whether to enable cache meta information (caption and image size) for faster dataset loading',
			},
			{
				displayName: 'Output Config',
				name: 'output_config',
				type: 'boolean',
				default: false,
				description: 'Whether to enable output command line args to given .toml file',
			},
			{
				displayName: 'Persistent Data Loader Workers',
				name: 'persistent_data_loader_workers',
				type: 'boolean',
				default: false,
				description: 'Whether to enable keeps data loaders persistent for better performance. (useful for reduce time gap between epoch, but may use more memory).',
			},
			{
				displayName: 'Save State On Train End',
				name: 'save_state_on_train_end',
				type: 'boolean',
				default: false,
				description: 'Whether to enable saves the training state at the end of the training process. (including optimizer states etc.).',
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
		const save_sample_prompt = this.getNodeParameter('save_sample_prompt', 0, '') as string;
		const learning_rate = this.getNodeParameter('learning_rate', 0) as number;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const max_train_steps = this.getNodeParameter('max_train_steps', 0) as number;
		const save_every_n_steps = this.getNodeParameter('save_every_n_steps', 0) as number;
		const gradient_checkpointing = this.getNodeParameter('gradient_checkpointing', 0, false) as boolean;
		const train_text_encoder = this.getNodeParameter('train_text_encoder', 0, false) as boolean;
		const full_bf16 = this.getNodeParameter('full_bf16', 0, false) as boolean;
		const full_fp16 = this.getNodeParameter('full_fp16', 0, false) as boolean;
		const train_batch_size = this.getNodeParameter('train_batch_size', 0) as number;
		const sample_sampler = this.getNodeParameter('sample_sampler', 0) as string;
		const cache_latents = this.getNodeParameter('cache_latents', 0, false) as boolean;
		const cache_latents_to_disk = this.getNodeParameter('cache_latents_to_disk', 0, false) as boolean;
		const mem_eff_attn = this.getNodeParameter('mem_eff_attn', 0, false) as boolean;
		const xformers = this.getNodeParameter('xformers', 0, false) as boolean;
		const use_8bit_adam = this.getNodeParameter('use_8bit_adam', 0, false) as boolean;
		const enable_bucket = this.getNodeParameter('enable_bucket', 0, false) as boolean;
		const lr_scheduler = this.getNodeParameter('lr_scheduler', 0) as string;
		const lr_scheduler_num_cycles = this.getNodeParameter('lr_scheduler_num_cycles', 0) as number;
		const gradient_accumulation_steps = this.getNodeParameter('gradient_accumulation_steps', 0) as number;
		const max_grad_norm = this.getNodeParameter('max_grad_norm', 0, 0) as number;
		const mixed_precision = this.getNodeParameter('mixed_precision', 0) as string;
		const save_precision = this.getNodeParameter('save_precision', 0) as string;
		const save_every_n_epochs = this.getNodeParameter('save_every_n_epochs', 0) as number;
		const optimizer_type = this.getNodeParameter('optimizer_type', 0) as string;
		const optimizer_args = this.getNodeParameter('optimizer_args', 0, '') as string;
		const bucket_reso_steps = this.getNodeParameter('bucket_reso_steps', 0) as number;
		const noise_offset = this.getNodeParameter('noise_offset', 0) as number;
		const bucket_no_upscale = this.getNodeParameter('bucket_no_upscale', 0, false) as boolean;
		const sample_every_n_epochs = this.getNodeParameter('sample_every_n_epochs', 0) as number;
		const sample_every_n_steps = this.getNodeParameter('sample_every_n_steps', 0) as number;
		const num_of_repeats = this.getNodeParameter('num_of_repeats', 0) as number;
		const cache_info = this.getNodeParameter('cache_info', 0, false) as boolean;
		const output_config = this.getNodeParameter('output_config', 0, false) as boolean;
		const persistent_data_loader_workers = this.getNodeParameter('persistent_data_loader_workers', 0, false) as boolean;
		const save_state_on_train_end = this.getNodeParameter('save_state_on_train_end', 0, false) as boolean;
		const selectedFolder = this.getNodeParameter('selectedFolder', 0, '') as string;
		const selectedFolderUrl = this.getNodeParameter('selectedFolderUrl', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/train-dreambooth-sdxl',
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
				save_sample_prompt,
				learning_rate,
				resolution,
				seed,
				max_train_steps,
				save_every_n_steps,
				gradient_checkpointing,
				train_text_encoder,
				full_bf16,
				full_fp16,
				train_batch_size,
				sample_sampler,
				cache_latents,
				cache_latents_to_disk,
				mem_eff_attn,
				xformers,
				use_8bit_adam,
				enable_bucket,
				lr_scheduler,
				lr_scheduler_num_cycles,
				gradient_accumulation_steps,
				max_grad_norm,
				mixed_precision,
				save_precision,
				save_every_n_epochs,
				optimizer_type,
				optimizer_args,
				bucket_reso_steps,
				noise_offset,
				bucket_no_upscale,
				sample_every_n_epochs,
				sample_every_n_steps,
				num_of_repeats,
				cache_info,
				output_config,
				persistent_data_loader_workers,
				save_state_on_train_end,
				selectedFolder,
				selectedFolderUrl,
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
