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

export class TrainFluxLoraPortrait implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Train Flux Lora Portrait',
		name: 'trainFluxLoraPortrait',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Fast LoRA training is a technique used to fine-tune FLUX models, enabling personalized model ou',
		defaults: {
			name: 'Wiro - Train Flux Lora Portrait',
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
		const triggerWord = this.getNodeParameter('triggerWord', 0) as string;
		const trainingSteps = this.getNodeParameter('trainingSteps', 0) as number;
		const learningRate = this.getNodeParameter('learningRate', 0) as number;
		const selectedFolder = this.getNodeParameter('selectedFolder', 0, '') as string;
		const selectedFolderUrl = this.getNodeParameter('selectedFolderUrl', 0, '') as string;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/train-flux-lora-portrait',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				trainModelName,
				triggerWord,
				trainingSteps,
				learningRate,
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
