import { MovieStatistic } from '@prisma/client';
import { getMovieViewKeys, prisma, redis } from '@library/database';
import { logger } from '@library/logger';

setInterval(function (): void {
	const startTime: number = Date.now();
	const movieIds: MovieStatistic['movieId'][] = [];
	const keys: string[] = [];

	getMovieViewKeys(new Set<string>(), '0')
	.then(function (_keys: Set<string>): Promise<(string | null)[]> | [] {
		if(_keys['size'] !== 0) {
			for(const key of _keys) {
				movieIds.push(Number.parseInt(key.slice(10), 10));
				keys.push(key);
			}

			return redis.mget(keys);
		} else {
			return [];
		}
	})
	.then(function (results: (string | null)[]): Promise<[number, number]> | [number, number] {
		if(results['length'] !== 0) {
			const values: string[] = [];

			for(let i: number = 0; i < results['length']; i++) {
				if(results[i] !== null) {
					values.push('((SELECT id FROM current_movie_statistic WHERE movie_id = ' + movieIds[i] + '), ' + results[i] + ')');
				}
			}

			if(values['length'] !== 0) {
				return Promise.all([redis.unlink(keys), prisma.$executeRawUnsafe('INSERT IGNORE INTO movie_statistic (id, view_count) VALUES ' + values.join(', ') + ' ON DUPLICATE KEY UPDATE view_count = view_count + VALUES(view_count)')]);
			}
		}

		return [0, 0];
	})
	.then(function (results: [number, number]): void {
		logger.debug(results[0] + ' views have been unlinked, and ' + results[1] / 2 + ' rows have been updated (' + (Date.now() - startTime) + 'ms)');

		return;
	})
	.catch(logger.error);

	return;
}, 300000);