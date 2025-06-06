import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class WiroApi implements ICredentialType {
	name = 'wiroApi';
	displayName = 'Wiro API';
	documentationUrl = 'https://wiro.ai/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
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
		},
	];
}
