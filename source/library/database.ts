import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { logger } from './logger';
import { randomBytes } from 'crypto';

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

const handleCharacter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';

export function getUniqueRandomHandle(): Promise<string> {
	let handle: string = '';
	
	for(const byte of randomBytes(30)) {
		handle += handleCharacter[byte % 65];
	}

	return prisma['user'].count({
		where: {
			handle: handle
		}
	})
	.then(function (userCount: number): Promise<string> | string {
		if(userCount === 0) {
			return handle;
		} else {
			return getUniqueRandomHandle();
		}
	})
}

export function getMovieViewKeys(keys: Set<string>, cursor: string): Promise<Set<string>> {
	return redis.scan(cursor, 'MATCH', 'movieView:*')
	.then(function (results: [string, string[]]): Promise<Set<string>> | Set<string> {
		console.log(keys, results)
		for(let i: number = 0; i < results[1]['length']; i++) {
			keys.add(results[1][i]);
		}

		if(results[0] !== '0') {
			return getMovieViewKeys(keys, results[0]);
		} else {
			return keys;
		}
	})
}