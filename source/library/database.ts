
import { HANDLE_CHARACTER, REPORT_TYPES } from '@library/constant';
import { randomBytes } from 'crypto';
import { Database, User } from '@library/type';
import { createPool } from 'mariadb';
import { Kysely } from 'kysely';
import { Redis } from 'ioredis';
import { MariadbDialect } from '@library/mariadbDialect';
import { Client } from '@elastic/elasticsearch';
import Logger from './logger';

export const kysely: Kysely<Database> = new Kysely<Database>({
	dialect: new MariadbDialect(createPool(process['env']['DATABASE_URL']))
});

export const redis: Redis = new Redis(process['env']['CACHE_DATABASE_URL'])
.on('error', function (error: Error): void {
	switch((error as Error & Record<'code', string>)['code']) {
		case 'ECONNRESET':
		case 'ECONNREFUSED': {
			break;
		}

		default: {
			Logger['logger'].error(error);

			break;
		}
	}

	return;
});

export const elasticsearch: Client = new Client({
	node: process['env']['SEARCH_DATABASE_URL']
});

export function getUniqueRandomHandle(): Promise<string> {
	let handle: string = '';

	for(const byte of randomBytes(30)) {
		handle += HANDLE_CHARACTER[byte % 65];
	}

	return kysely.selectFrom('user')
	.select('id')
	.where('handle', '=', handle)
	.executeTakeFirst()
	.then(function (user?: Pick<User, 'id'>): Promise<string> | string {
		if(typeof(user) === 'undefined') {
			return handle;
		} else {
			return getUniqueRandomHandle();
		}
	});
}

export function getKeys(pattern: string, keys: Set<string> = new Set<string>(), cursor: string = '0'): Promise<Set<string>> {
	return redis.scan(cursor, 'MATCH', pattern)
	.then(function (results: [string, string[]]): Promise<Set<string>> | Set<string> {
		for(let i: number = 0; i < results[1]['length']; i++) {
			keys.add(results[1][i]);
		}

		if(results[0] !== '0') {
			return getKeys(pattern, keys, results[0]);
		} else {
			return keys;
		}
	});
}