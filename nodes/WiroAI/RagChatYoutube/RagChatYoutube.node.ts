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

export class RagChatYoutube implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Rag Chat Youtube',
		name: 'ragChatYoutube',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Extract insights directly from YouTube videos by simply providing a URL. Choose your LLM model,',
		defaults: {
			name: 'Wiro - Rag Chat Youtube',
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
				displayName: 'Select Model',
				name: 'selectedModel',
				type: 'options',
				default: '',
				description: 'Select-model-help',
				options: [
					{ name: '', value: '' },
				],
			},
			{
				displayName: 'Select Model Private',
				name: 'selectedModelPrivate',
				type: 'options',
				default: '',
				description: 'Select-model-private-help',
				options: [
				],
			},
			{
				displayName: 'Youtube Video URL',
				name: 'websiteUrl',
				type: 'string',
				default: '',
				description: 'Enter a youtube video URL',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				description: 'Prompt to send to the model',
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'You can leave it blank. The user_id parameter is a unique identifier for the user. It is used to store and retrieve the chat history specific to that user. You should provide a value that uniquely identifies the user across different sessions. For example, it can be the user’s email address, username, or a system-generated ID',
			},
			{
				displayName: 'Session ID',
				name: 'session_id',
				type: 'string',
				default: '',
				description: 'You can leave it blank. The session_id parameter represents a specific session for a user. It allows you to manage multiple sessions for the same user. If you want to maintain separate chat histories for different sessions of the same user, use a unique session_id for each session. If not specified or kept the same, the system will treat all interactions as part of the same session',
			},
			{
				displayName: 'System Prompt',
				name: 'system_prompt',
				type: 'string',
				default: '',
				description: 'System prompt to send to the model. This is prepended to the prompt and helps guide system behavior.',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				description: 'Adjusts randomness of outputs, greater than 1 is random and 0 is deterministic, 0.75 is a good starting value',
			},
			{
				displayName: 'Top P',
				name: 'top_p',
				type: 'number',
				default: 0,
				description: 'When decoding text, samples from the top p percentage of most likely tokens; lower to ignore less likely tokens',
			},
			{
				displayName: 'Top K',
				name: 'top_k',
				type: 'number',
				default: 0,
				description: 'When decoding text, samples from the top k most likely tokens; lower to ignore less likely tokens',
			},
			{
				displayName: 'Chunk Size',
				name: 'chunk_size',
				type: 'number',
				default: 0,
				description: 'Defines the size (number of tokens) of each chunk of text that is retrieved and processed by the model during the retrieval phase. Larger values may improve context, but can increase processing time and memory usage.',
			},
			{
				displayName: 'Chunk Overlap',
				name: 'chunk_overlap',
				type: 'number',
				default: 0,
				description: 'Specifies how many tokens from the previous chunk should overlap with the next chunk to ensure continuity and avoid missing important context. Higher overlap ensures smoother transitions but may result in redundant processing.',
			},
			{
				displayName: 'Similarity Top K',
				name: 'similarity_top_k',
				type: 'number',
				default: 0,
				description: 'Determines the number of most similar documents or chunks to retrieve based on their similarity scores. A higher value increases the amount of context provided but may also introduce irrelevant information.',
			},
			{
				displayName: 'Context Window',
				name: 'context_window',
				type: 'number',
				default: 0,
				description: 'Use 0 to set max limit of the model. Specifies the maximum number of tokens a language model can process at once, including both the input query and retrieved chunks, ensuring the model operates within its token limit.',
			},
			{
				displayName: 'Max New Tokens',
				name: 'maxNewOutputLength',
				type: 'number',
				default: 0,
				description: 'Use 0 to set dynamic response limit. Specifies the maximum number of tokens that the language model is allowed to generate in response to a query. This parameter controls the length of the model’s output, helping to prevent overly long or incomplete responses',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '',
				description: 'Seed-help',
			},
			{
				displayName: 'Quantization',
				name: 'quantization',
				type: 'boolean',
				default: false,
				description: 'Whether to enable quantization is a technique that reduces the precision of model weights (e.g., from fp32 to int8) to decrease memory usage and improve inference speed. when enabled (true), the model uses less vram, making it suitable for resource-constrained environments, but might slightly affect output quality. when disabled (false), the model runs at full precision, ensuring maximum accuracy but requiring more gpu memory and running slower',
			},
			{
				displayName: 'Do Sample',
				name: 'do_sample',
				type: 'boolean',
				default: false,
				description: 'Whether to enable the do_sample parameter controls whether the model generates text deterministically or with randomness. for precise tasks like translations or code generation, set do_sample = false to ensure consistent and predictable outputs. for creative tasks like storytelling or poetry, set do_sample = true to allow the model to produce diverse and imaginative results',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const selectedModel = this.getNodeParameter('selectedModel', 0, '') as string;
		const selectedModelPrivate = this.getNodeParameter('selectedModelPrivate', 0, '') as string;
		const websiteUrl = this.getNodeParameter('websiteUrl', 0, '') as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const user_id = this.getNodeParameter('user_id', 0, '') as string;
		const session_id = this.getNodeParameter('session_id', 0, '') as string;
		const system_prompt = this.getNodeParameter('system_prompt', 0, '') as string;
		const temperature = this.getNodeParameter('temperature', 0, 0) as number;
		const top_p = this.getNodeParameter('top_p', 0, 0) as number;
		const top_k = this.getNodeParameter('top_k', 0, 0) as number;
		const chunk_size = this.getNodeParameter('chunk_size', 0, 0) as number;
		const chunk_overlap = this.getNodeParameter('chunk_overlap', 0, 0) as number;
		const similarity_top_k = this.getNodeParameter('similarity_top_k', 0, 0) as number;
		const context_window = this.getNodeParameter('context_window', 0, 0) as number;
		const maxNewOutputLength = this.getNodeParameter('maxNewOutputLength', 0, 0) as number;
		const seed = this.getNodeParameter('seed', 0, '') as string;
		const quantization = this.getNodeParameter('quantization', 0, false) as boolean;
		const do_sample = this.getNodeParameter('do_sample', 0, false) as boolean;

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

			const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/rag-chat-youtube',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: {
				selectedModel,
				selectedModelPrivate,
				websiteUrl,
				prompt,
				user_id,
				session_id,
				system_prompt,
				temperature,
				top_p,
				top_k,
				chunk_size,
				chunk_overlap,
				similarity_top_k,
				context_window,
				max_new_tokens: maxNewOutputLength,
				seed,
				quantization,
				do_sample,
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
			message: '',
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
				responseJSON.message = result ?? '';
		}

		returnData.push({
			json: responseJSON,
		});

		return [returnData];
	}
}
