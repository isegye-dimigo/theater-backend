import { MovieStatistic } from '@prisma/client';
import { prisma, redis } from '@library/database';
import { logger } from '@library/logger';
import { RejectFunction, ResolveFunction } from './type';

setInterval(function (): void {
	prisma.$executeRawUnsafe('INSERT INTO movie_statistic (movie_id, view_count, like_count, comment_count, star_average) SELECT movie_id, view_count, like_count, comment_count, star_average FROM current_movie_statistic WHERE created_at <= NOW() - INTERVAL 10 MINUTE')
	//prisma.$executeRawUnsafe('INSERT INTO movie_statistic (movie_id, view_count, like_count, comment_count, star_average) SELECT movie_id, view_count, like_count, comment_count, star_average FROM current_movie_statistic')
	.then(function (affactedRowCount: number): void {
		if(affactedRowCount !== 0) {
			logger.debug(affactedRowCount + ' rows have been created');
		}

		return;
	})
	.catch(logger.error);

	return;
}, 60000);

setInterval(function (): void {
	prisma.$executeRawUnsafe('UPDATE movie_statistic, current_movie_statistic SET movie_statistic.comment_count = current_movie_statistic.comment_count, movie_statistic.like_count = current_movie_statistic.like_count, movie_statistic.star_average = current_movie_statistic.star_average WHERE movie_statistic.id = current_movie_statistic.id')
	.then(function (affactedRowCount: number): void {
		logger.debug(affactedRowCount + ' rows have been updated');

		return;
	})
	.catch(logger.error);

	return;
}, 60000);

setInterval(function (): void {
	const movieIds: MovieStatistic['movieId'][] = [];
	const keys: string[] = [];

	new Promise<Set<string>>(function (resolve: ResolveFunction<Set<string>>, reject: RejectFunction): void {
		const keys: Set<string> = new Set<string>();
		let cursor: string = '0';
		
		(function scanKeys(): Promise<void> {
			return redis.scan(cursor, 'MATCH', 'movieView:*')
			.then(function (results: [string, string[]]): Promise<void> | void {
				for(let i: number = 0; i < results[1]['length']; i++) {
					keys.add(results[1][i]);
				}

				if(results[0] !== '0') {
					cursor = results[0];

					return scanKeys();
				} else {
					resolve(keys);

					return;
				}
			})
			.catch(reject);
		})();

		return;
	})
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
			let transaction = 'BEGIN NOT ATOMIC DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING BEGIN ROLLBACK;END;START TRANSACTION;';
	
			for(let i: number = 0; i < results['length']; i++) {
				if(results[i] !== null) {
					transaction += 'UPDATE movie_statistic, current_movie_statistic SET movie_statistic.view_count = movie_statistic.view_count + ' + results[i] + ' WHERE movie_statistic.id = current_movie_statistic.id AND movie_statistic.movie_id = ' + movieIds[i] + ';';
				}
			}
	
			if(transaction['length'] !== 104) {
				return Promise.all([redis.unlink(keys), prisma.$executeRawUnsafe(transaction + 'COMMIT;END')]);
			}
		}

		return [0, 0];
	})
	.then(function (results: [number, number]): void {
		if(results[0] !== 0 || results[1] !== 0) {
			logger.debug(results[0] + ' views have been unlinked and, ' + results[1] + ' rows have been updated');
		}

		return;
	})
	.catch(logger.error);

	return;
}, 60000);