import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WiroApi implements ICredentialType {
	name = 'wiroApi';
	displayName = 'Wiro API';
	documentationUrl = 'https://wiro.ai/docs/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			default: 'signatureBased',
			options: [
				{
					name: 'Signature-Based (Recommended)',
					value: 'signatureBased',
				},
				{
					name: 'API Key Only (Simple)',
					value: 'apiKeyOnly',
				},
			],
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authMethod: ['signatureBased'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			baseURL: 'https://api.wiro.ai',
			url: '/v1/Task/Detail',
			body: { tasktoken: 'test' },
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
