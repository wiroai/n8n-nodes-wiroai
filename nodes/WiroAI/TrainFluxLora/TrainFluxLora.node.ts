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

export class TrainFluxLora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Train Flux Lora',
		name: 'trainFluxLora',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'LoRA training is a low-rank adaptation technique used to fine-tune FLUX models, enabling person',
		defaults: {
			name: 'Wiro - Train Flux Lora',
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
				required: true,
				description: 'Reference-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Quantize',
				name: 'quantize',
				type: 'boolean',
				default: false,
				description: 'Whether to enable if you check the quantize checkbox, the base model will be loaded in a quantized format, which significantly reduces vram usage and allows training on low-vram gpus. however, this may result in a slight decrease in output quality.',
			},
			{
				displayName: 'Trigger Word',
				name: 'triggerWord',
				type: 'string',
				default: '',
				required: true,
				description: 'A short descriptor of your subject using a UNIQUE keyword and a classifier word. If training a man, your instance prompt could be "ohwx". The key here is that "ohwx" is not a word that might overlap with something in the real world "man" is a generic word to describe your subject',
			},
			{
				displayName: 'Training Steps',
				name: 'trainingSteps',
				type: 'number',
				default: 0,
				required: true,
				description: 'How many total training steps to complete. You should train for appx 100 steps per sample image. So, if you have 40 instance/sample images, you would train for 4k steps. Recommended range 500-4000',
			},
			{
				displayName: 'Learning Rate',
				name: 'learningRate',
				type: 'number',
				default: 0,
				required: true,
				description: 'To get good-quality images, we must find a \'sweet spot\' between the number of training steps and the learning rate. We recommend using a low learning rate and progressively increasing the number of steps until the results are satisfactory.',
			},
			{
				displayName: 'Batch Size',
				name: 'batchSize',
				type: 'number',
				default: 0,
				required: true,
				description: 'Batch-size-help',
			},
			{
				displayName: 'Save Every',
				name: 'saveEvery',
				type: 'number',
				default: 0,
				required: true,
				description: 'Save trained checkpoint every x steps',
			},
			{
				displayName: 'Checkpoints Total Limit',
				name: 'max_step_saves_to_keep',
				type: 'number',
				default: 0,
				required: true,
				description: 'Max number of checkpoints to store',
			},
			{
				displayName: 'Gradient Accumulation Steps',
				name: 'gradient_accumulation_steps',
				type: 'number',
				default: 0,
				required: true,
				description: 'The gradient_accumulation_steps parameter value',
			},
			{
				displayName: 'Lora Rank',
				name: 'lora_rank',
				type: 'number',
				default: 0,
				required: true,
				description: 'Higher ranks take longer to train but can capture more complex features. Caption quality is more important for higher ranks.',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'string',
				default: '',
				required: true,
				description: 'Training image resolution(s). Enter one value like 512, or multiple values separated by commas: 512,768,1024.',
			},
			{
				displayName: 'Gradient Checkpointing',
				name: 'gradient_checkpointing',
				type: 'boolean',
				default: false,
				description: 'Whether to enable turn on gradient checkpointing; saves memory at the cost of training speed. automatically enabled for batch sizes > 1.',
			},
			{
				displayName: 'Caption Dropout Rate',
				name: 'caption_dropout_rate',
				type: 'number',
				default: 0,
				required: true,
				description: 'Advanced setting. Determines how often a caption is ignored. 0.05 means for 5% of all steps an image will be used without its caption. 0 means always use captions, while 1 means never use them. Dropping captions helps capture more details of an image, and can prevent over-fitting words with specific image elements. Try higher values when training a style',
			},
			{
				displayName: 'Autocaption',
				name: 'autocaption',
				type: 'boolean',
				default: false,
				description: 'Whether to enable automatically caption images using llava-v1.6-mistral-7b-hf',
			},
			{
				displayName: 'Autocaption Prefix',
				name: 'autocaption_prefix',
				type: 'string',
				default: '',
				description: 'Optional: Text you want to appear at the beginning of all your generated captions; for example, ‘a photo of ohwx, ’. You can include your trigger word in the prefix. Prefixes help set the right context for your captions, and the captioner will use this prefix as context',
			},
			{
				displayName: 'Autocaption Suffix',
				name: 'autocaption_suffix',
				type: 'string',
				default: '',
				description: 'Optional: Text you want to appear at the end of all your generated captions; for example, ‘ in the style of ohwx’. You can include your trigger word in suffixes. Suffixes help set the right concept for your captions, and the captioner will use this suffix as context',
			},
			{
				displayName: 'Optimizer',
				name: 'optimizer',
				type: 'options',
				default: 'adafactor',
				required: true,
				description: 'Optimizer to use for training. Supports: prodigy, adam8bit, adamw8bit, lion8bit, adam, adamw, lion, adagrad, adafactor.',
				options: [
					{ name: 'Adafactor', value: 'adafactor' },
					{ name: 'Adagrad', value: 'adagrad' },
					{ name: 'Adam', value: 'adam' },
					{ name: 'Adam8bit', value: 'adam8bit' },
					{ name: 'Adamw', value: 'adamw' },
					{ name: 'Adamw8bit', value: 'adamw8bit' },
					{ name: 'Lion', value: 'lion' },
					{ name: 'Lion8bit', value: 'lion8bit' },
					{ name: 'Prodigy', value: 'prodigy' },
				],
			},
			{
				displayName: 'Cache Latents',
				name: 'cache_latents',
				type: 'boolean',
				default: false,
				description: 'Whether to enable use this if you have lots of input images and you hit out of memory errors',
			},
			{
				displayName: 'Cache Latents To Disk',
				name: 'cache_latents_to_disk',
				type: 'boolean',
				default: false,
				description: 'Whether to enable use this if you have lots of input images and you hit out of memory errors',
			},
			{
				displayName: 'Disable Sampling',
				name: 'disable_sampling',
				type: 'boolean',
				default: false,
				description: 'Whether to enable if you check the disable sampling checkbox, all the following input fields related to [samples] will be ignored',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: '[Samples] A prompt that is used during validation to verify that the model is learning',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				required: true,
				description: '[Samples] Random seed. Leave zero to randomize the seed.',
			},
			{
				displayName: 'Guidancescale',
				name: 'guidance_scale',
				type: 'number',
				default: 0,
				description: '[Samples] Scale for classifier-free guidance',
			},
			{
				displayName: 'Generate Sample Every Steps',
				name: 'sampleEvery',
				type: 'number',
				default: 0,
				description: '[Samples] Generate samples every x steps',
			},
			{
				displayName: 'Sample Steps',
				name: 'steps',
				type: 'number',
				default: 0,
				description: '[Samples] Number of denoising steps',
			},
			{
				displayName: 'Select A Folder For Training Data',
				name: 'selectedFolder',
				type: 'string',
				default: '',
				description: 'The selected folder containing the images that will be used for training. We recommend a minimum of 10 images. If you include captions, include them as one .txt file per image, e.g. my-photo.jpg should have a caption file named my-photo.txt. If you don\'t include captions, you can use autocaptioning',
			},
			{
				displayName: 'ZIP URL For Training Data',
				name: 'selectedFolderUrl',
				type: 'string',
				default: '',
				description: 'When a ZIP URL is provided, it is automatically extracted and used as the training folder. A zip file containing the images that will be used for training. We recommend a minimum of 10 images. If you include captions, include them as one .txt file per image, e.g. my-photo.jpg should have a caption file named my-photo.txt. If you don\'t include captions, you can use autocaptioning',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const trainModelName = this.getNodeParameter('trainModelName', 0) as string;
		const trainModelDescription = this.getNodeParameter('trainModelDescription', 0, '') as string;
		const referenceModel = this.getNodeParameter('referenceModel', 0) as string;
		const quantize = this.getNodeParameter('quantize', 0, false) as boolean;
		const triggerWord = this.getNodeParameter('triggerWord', 0) as string;
		const trainingSteps = this.getNodeParameter('trainingSteps', 0) as number;
		const learningRate = this.getNodeParameter('learningRate', 0) as number;
		const batchSize = this.getNodeParameter('batchSize', 0) as number;
		const saveEvery = this.getNodeParameter('saveEvery', 0) as number;
		const max_step_saves_to_keep = this.getNodeParameter('max_step_saves_to_keep', 0) as number;
		const gradient_accumulation_steps = this.getNodeParameter('gradient_accumulation_steps', 0) as number;
		const lora_rank = this.getNodeParameter('lora_rank', 0) as number;
		const resolution = this.getNodeParameter('resolution', 0) as string;
		const gradient_checkpointing = this.getNodeParameter('gradient_checkpointing', 0, false) as boolean;
		const caption_dropout_rate = this.getNodeParameter('caption_dropout_rate', 0) as number;
		const autocaption = this.getNodeParameter('autocaption', 0, false) as boolean;
		const autocaption_prefix = this.getNodeParameter('autocaption_prefix', 0, '') as string;
		const autocaption_suffix = this.getNodeParameter('autocaption_suffix', 0, '') as string;
		const optimizer = this.getNodeParameter('optimizer', 0) as string;
		const cache_latents = this.getNodeParameter('cache_latents', 0, false) as boolean;
		const cache_latents_to_disk = this.getNodeParameter('cache_latents_to_disk', 0, false) as boolean;
		const disable_sampling = this.getNodeParameter('disable_sampling', 0, false) as boolean;
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const guidance_scale = this.getNodeParameter('guidance_scale', 0, 0) as number;
		const sampleEvery = this.getNodeParameter('sampleEvery', 0, 0) as number;
		const steps = this.getNodeParameter('steps', 0, 0) as number;
		const selectedFolder = this.getNodeParameter('selectedFolder', 0, '') as string;
		const selectedFolderUrl = this.getNodeParameter('selectedFolderUrl', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/train-flux-lora',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				trainModelName,
				trainModelDescription,
				referenceModel,
				quantize,
				triggerWord,
				trainingSteps,
				learningRate,
				batchSize,
				saveEvery,
				max_step_saves_to_keep,
				gradient_accumulation_steps,
				lora_rank,
				resolution,
				gradient_checkpointing,
				caption_dropout_rate,
				autocaption,
				autocaption_prefix,
				autocaption_suffix,
				optimizer,
				cache_latents,
				cache_latents_to_disk,
				disable_sampling,
				prompt,
				seed,
				guidance_scale,
				sampleEvery,
				steps,
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
