import { redis } from '@library/database';
import { TooManyRequests } from '@library/error'
import { Request } from '@library/type';

const rateLimit: number = Number(process['env']['RATE_LIMIT']);

export default function (request: Request): Promise<void> {
	const key: string = 'rateLimit:' + request['ip'];

	return redis.incr(key)
	.then(function (requestCount: number): void {
		if(requestCount === 1) {
			redis.expire(key, 60)
			.catch(request['server']['logger'].error);
		} else if(requestCount > rateLimit) {
			throw new TooManyRequests('Request per minute must be fewer');
		}

		return;
	});
}