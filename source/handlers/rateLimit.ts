import { redis } from '@library/database';
import { TooManyRequests } from '@library/httpError';
import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';

const rateLimit: number = Number.parseInt(process['env']['RATE_LIMIT'], 10);

export default function rateLimitHandler(request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	const key: string = 'rateLimit:' + request['ip'];
	
	redis.multi()
	.incr(key)
	.expire(key, 60, 'XX')
	.exec()
	.then(function (results: [Error | null, unknown][] | null) {
		if(results !== null) {
			if(results[0][1] as number <= rateLimit) {
				done();

				return;
			} else {
				throw new TooManyRequests('Request per minute must be fewer');
			}
		} else {
			throw new Error('Redis unknown error');
		}
	})
	.catch(done);

	return;
}