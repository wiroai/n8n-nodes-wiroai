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

export class RagChatYoutube implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wiro - Ask Questions to a YouTube Video With AI',
		name: 'ragChatYoutube',
		icon: { light: 'file:wiro.svg', dark: 'file:wiro.svg' },
		group: ['transform'],
		version: 1,
		description: 'Ask questions and get instant answers from any YouTube video using Wiro’s RAG AI',
		defaults: {
			name: 'Wiro - Ask Questions to a YouTube Video With AI',
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
				displayName: 'Website URL',
				name: 'websiteUrl',
				type: 'string',
				default: 'https://youtube.com/watch?v=Yq0QkCxoTHM',
				required: true,
				description: 'The full URL of the YouTube video you want the AI to analyze and chat about',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: 'What is the YouTube video about?',
				required: true,
				description: 'The question or message you want to ask about the YouTube video content',
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Optional user identifier for session continuity',
			},
			{
				displayName: 'Session ID',
				name: 'session_id',
				type: 'string',
				default: '',
				description: 'Optional session identifier for the chat history',
			},
			{
				displayName: 'System Prompt',
				name: 'system_prompt',
				type: 'string',
				default:
					"You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature. If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.",
				required: true,
				description: 'Defines the AI assistant’s behavior and tone',
			},
			{
				displayName: 'Selected Model',
				name: 'selectedModel',
				type: 'options',
				default: '757',
				required: true,
				description: 'Select a LLM - Chat Model',
				options: [
					{ name: 'Qwen/Qwen2.5-14B-Instruct', value: '757' },
					{ name: 'Qwen/Qwen2.5-32B-Instruct', value: '756' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', value: '743' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B', value: '742' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B', value: '741' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', value: '740' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', value: '739' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'utter-project/EuroLLM-9B-Instruct', value: '735' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'utter-project/EuroLLM-1.7B-Instruct', value: '734' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'm42-health/Llama3-Med42-8B', value: '730' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/Llama-3.2-3B-Instruct', value: '728' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/CodeLlama-34b-Instruct-hf', value: '726' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/CodeLlama-7b-Instruct-hf', value: '725' },
					{ name: 'internlm/internlm3-8b-instruct', value: '720' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'CohereForAI/aya-expanse-8b', value: '719' },
					{ name: 'mistralai/Mistral-Nemo-Instruct-2407', value: '717' },
					{ name: 'HuggingFaceTB/SmolLM2-1.7B-Instruct', value: '716' },
					{ name: 'mistralai/Mathstral-7B-v0.1', value: '714' },
					{ name: 'deepseek-ai/deepseek-math-7b-instruct', value: '713' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'microsoft/Phi-3.5-mini-instruct', value: '712' },
					{ name: 'Qwen/Qwen2.5-3B-Instruct', value: '711' },
					{ name: 'Qwen/Qwen2.5-0.5B-Instruct', value: '710' },
					{ name: 'Qwen/Qwen2.5-1.5B-Instruct', value: '709' },
					{ name: 'Qwen/Qwen2-7B-Instruct', value: '692' },
					{ name: 'Qwen/Qwen2.5-Math-7B-Instruct', value: '691' },
					{ name: 'Qwen/Qwen2.5-Math-1.5B-Instruct', value: '690' },
					{ name: 'Qwen/Qwen2.5-Coder-7B-Instruct', value: '689' },
					{ name: 'Qwen/Qwen1.5-0.5B-Chat', value: '688' },
					{ name: 'microsoft/phi-4', value: '686' },
					{ name: 'Qwen/Qwen2.5-Coder-32B-Instruct', value: '685' },
					{ name: 'google/gemma-2-2b-it', value: '684' },
					{ name: 'google/gemma-2-9b-it', value: '683' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/Meta-Llama-3-8B-Instruct', value: '682' },
					{ name: 'mistralai/Mistral-7B-Instruct-v0.3', value: '681' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/Llama-3.1-8B-Instruct', value: '680' },
					{ name: 'Qwen/Qwen2.5-7B-Instruct', value: '679' },
					{ name: 'wiro/wiroai-turkish-llm-8b', value: '676' },
					{ name: 'wiro/wiroai-turkish-llm-9b', value: '675' },
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'meta-llama/Llama-2-7b-chat-hf', value: '617' },
				],
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'string',
				default: '0.7',
				required: true,
				description: 'Adjusts randomness of outputs',
			},
			{
				displayName: 'Top P',
				name: 'top_p',
				type: 'string',
				default: '0.95',
				required: true,
				description: 'Samples from the top p percentage of most likely tokens',
			},
			{
				displayName: 'Top K',
				name: 'top_k',
				type: 'string',
				default: '50',
				required: true,
				description: 'Samples from the top k most likely tokens',
			},
			{
				displayName: 'Chunk Size',
				name: 'chunk_size',
				type: 'string',
				default: '256',
				required: true,
				description: 'Size of text chunks in tokens',
			},
			{
				displayName: 'Chunk Overlap',
				name: 'chunk_overlap',
				type: 'string',
				default: '25',
				required: true,
				description: 'Number of overlapping tokens between chunks',
			},
			{
				displayName: 'Similarity Top K',
				name: 'similarity_top_k',
				type: 'string',
				default: '5',
				required: true,
				description: 'Number of most relevant chunks used for context',
			},
			{
				displayName: 'Context Window',
				name: 'context_window',
				type: 'string',
				default: '0',
				required: true,
				description: 'Token limit for input context',
			},
			{
				displayName: 'Max New Tokens',
				name: 'max_new_tokens',
				// eslint-disable-next-line n8n-nodes-base/node-param-type-options-password-missing
				type: 'string',
				default: '0',
				required: true,
				description: 'Maximum number of tokens to generate',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'string',
				default: '784885',
				required: true,
				description: 'Seed value for reproducible outputs',
			},
			{
				displayName: 'Quantization',
				name: 'quantization',
				type: 'string',
				default: '--quantization',
				required: true,
				description: 'Enable quantized models for performance',
			},
			{
				displayName: 'Do Sample',
				name: 'do_sample',
				type: 'string',
				default: '--do_sample',
				description: 'Whether to enable sampling randomness',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('wiroApi');
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const headers = generateWiroAuthHeaders(apiKey, apiSecret);

		const websiteUrl = this.getNodeParameter('websiteUrl', 0) as string;
		const prompt = this.getNodeParameter('prompt', 0) as string;
		const user_id = this.getNodeParameter('user_id', 0, '') as string;
		const session_id = this.getNodeParameter('session_id', 0, '') as string;
		const system_prompt = this.getNodeParameter('system_prompt', 0) as string;
		const selectedModel = this.getNodeParameter('selectedModel', 0) as string;
		const temperature = this.getNodeParameter('temperature', 0) as string;
		const top_p = this.getNodeParameter('top_p', 0) as string;
		const top_k = this.getNodeParameter('top_k', 0) as string;
		const chunk_size = this.getNodeParameter('chunk_size', 0) as string;
		const chunk_overlap = this.getNodeParameter('chunk_overlap', 0) as string;
		const similarity_top_k = this.getNodeParameter('similarity_top_k', 0) as string;
		const context_window = this.getNodeParameter('context_window', 0) as string;
		const max_new_tokens = this.getNodeParameter('max_new_tokens', 0) as string;
		const seed = this.getNodeParameter('seed', 0) as string;
		const quantization = this.getNodeParameter('quantization', 0, '') as string;
		const do_sample = this.getNodeParameter('do_sample', 0, '') as string;

		const body = {
			websiteUrl,
			prompt,
			user_id,
			session_id,
			system_prompt,
			selectedModel,
			temperature,
			top_p,
			top_k,
			chunk_size,
			chunk_overlap,
			similarity_top_k,
			context_window,
			max_new_tokens,
			seed,
			quantization,
			do_sample,
		};

		const response = await this.helpers.request({
			method: 'POST',
			url: 'https://api.wiro.ai/v1/Run/wiro/rag-chat-youtube',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body,
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

		returnData.push({ json: responseJSON });
		return [returnData];
	}
}
