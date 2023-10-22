import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import headerHandler from '@handlers/header';

export default function (error: FastifyError, request: FastifyRequest, reply: FastifyReply): void {
	if(typeof(error['validation']) === 'object') {
		error['statusCode'] = 400;
		error['message'] = error['message'][0].toUpperCase() + error['message'].slice(1);
	} else if(typeof(error['statusCode']) !== 'number') {
		error['statusCode'] = 500;
	}

	const isClientError: boolean = (error['statusCode'] as number) < 500;
	const isStackAvailable: boolean = typeof(error['stack']) === 'string' && process['env']['NODE_ENV'] === 'development';

	if(!isClientError) {
		const splitLogs: string[] = (error['stack'] as string).split('\n');

		for(let i: number = 0; i < splitLogs['length']; i++) {
			request['server']['log'].warn(splitLogs[i]);
		}
	}

	headerHandler(request, reply, function (error?: Error | null) {
		if(typeof(error) === 'object' && error !== null) {
			request['log'].error(error);
		}

		return;
	});

	reply.status(error['statusCode'] as number).send(isClientError ? {
		status: 'fail',
		data: Object.assign({
			title: error['message']
		}, isStackAvailable ? {
			body: error['stack']
		} : undefined)
	} : {
		status: 'error',
		code: error['statusCode'],
		message: error['message'] + (isStackAvailable ? '; ' + error['stack'] : '')
	});

	return;
}