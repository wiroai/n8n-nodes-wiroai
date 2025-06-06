import { IExecuteFunctions } from 'n8n-workflow';

export async function pollTaskUntilComplete(
	this: IExecuteFunctions,
	socketaccesstoken: string,
	headers: Record<string, string>,
	options?: {
		maxAttempts?: number;
		pollingIntervalMs?: number;
		debug?: boolean;
	},
): Promise<string | null> {
	const pollingIntervalMs = options?.pollingIntervalMs ?? 20000;
	const maxAttempts = options?.maxAttempts ?? 30;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		if (options?.debug) {
			//console.log(`⏳ Polling attempt #${attempt}`);
		}

		const taskRequest = {
			tasktoken: socketaccesstoken,
		};

		try {
			const response = await this.helpers.request({
				method: 'POST',
				url: 'https://api.wiro.ai/v1/Task/Detail',
				headers: {
					...headers,
					'Content-Type': 'application/json',
				},
				body: taskRequest,
				json: true,
			});

			const task = response.tasklist?.[0];
			const status = task?.status;

			if (status === 'task_cancel') {
				//throw new Error('🛑 Task cancelled.');
				return '-4';
			}

			if (status === 'task_postprocess_end') {
				const output = task.outputs?.[0];
				if (output?.url) {
					return output.url;
				}
				if (output?.content?.message) {
					return output.content.message;
				}

				//throw new Error('🛑 Task finished but no usable output.');
				return '-3';
			}
		} catch (err: any) {
			//console.error(`[Polling Error] ${err.message}`);
			return '-2';
		}

		await new Promise((res) => setTimeout(res, pollingIntervalMs));
	}

	//console.warn(`⚠️ Max polling attempts reached (${maxAttempts})`);
	return '-1';
}
