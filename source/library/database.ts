import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { logger } from './logger';

export const prisma: PrismaClient = new PrismaClient();

export const redis: Redis = new Redis(process['env']['SUB_DATABASE_URL']);

redis.on('error', function (error: Error): void {
	// @ts-expect-error
	switch(error['code']) {
		case 'ECONNRESET':
		case 'ECONNREFUSED': {
			// @ts-expect-error
			logger.trace('redis ' + error['code']);

			break;
		}

		default: {
			logger.error(error);

			return;
		}
	}

	return;
});