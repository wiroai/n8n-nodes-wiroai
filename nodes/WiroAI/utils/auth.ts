import * as crypto from 'crypto';

export function generateWiroAuthHeaders(apiKey: string, apiSecret: string) {
	const nonce = Math.floor(Date.now() / 1000).toString();
	const message = apiSecret + nonce;
	const hmac = crypto.createHmac('sha256', apiKey).update(message).digest('hex');

	return {
		'x-api-key': apiKey,
		'x-nonce': nonce,
		'x-signature': hmac,
	};
}
