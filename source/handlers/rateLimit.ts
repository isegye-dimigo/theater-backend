import { redis } from '@library/database';
import { TooManyRequests } from '@library/httpError';
import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';

const rateLimit: number = Number.parseInt(process['env']['RATE_LIMIT'], 10);

export default function (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	const key: string = 'rateLimit:' + request['ip'];

	redis.incr(key)
	.then(function (requestCount: number): void {
		if(requestCount === 1) {
			redis.expire(key, 60)
			.catch(request['log'].error);
		} else if(requestCount > rateLimit) {
			throw new TooManyRequests('Request per minute must be fewer');
		}

		done();

		return;
	})
	.catch(done);

	return;
}