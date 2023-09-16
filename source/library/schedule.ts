import { MovieStatistic } from '@prisma/client';
import { prisma, redis } from '@library/database';
import { logger } from '@library/logger';
import { RejectFunction, ResolveFunction } from '@library/type';

setInterval(function (): void {
	const overallStartTime: number = Date.now();
	let partStartTime: number = overallStartTime;
	const movieIds: MovieStatistic['movieId'][] = [];
	const keys: string[] = [];

	prisma.$executeRawUnsafe('INSERT INTO movie_statistic (movie_id, view_count, like_count, comment_count, star_average) SELECT movie_id, view_count, like_count, comment_count, star_average FROM current_movie_statistic WHERE created_at <= NOW() - INTERVAL 1 DAY')
	.then(function (affactedRowCount: number): Promise<number> {
		if(affactedRowCount !== 0) {
			const currentTime: number = Date.now();
			logger.debug(affactedRowCount + ' rows have been created (' + (currentTime - partStartTime) + 'ms)');

			partStartTime = currentTime;
		}

		return prisma.$executeRawUnsafe('UPDATE movie_statistic, current_movie_statistic SET movie_statistic.comment_count = current_movie_statistic.comment_count, movie_statistic.like_count = current_movie_statistic.like_count, movie_statistic.star_average = current_movie_statistic.star_average WHERE movie_statistic.id = current_movie_statistic.id');
	})
	.then(function (affactedRowCount: number): Promise<Set<string>> {
		const currentTime: number = Date.now();
		logger.debug(affactedRowCount + ' rows have been updated (' + (currentTime - partStartTime) + 'ms)');
		partStartTime = currentTime;

		return new Promise<Set<string>>(function (resolve: ResolveFunction<Set<string>>, reject: RejectFunction): void {
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
		});
	}).then(function (_keys: Set<string>): Promise<(string | null)[]> | [] {
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
		const currentTime: number = Date.now();

		if(results[0] !== 0 || results[1] !== 0) {
			logger.debug(results[0] + ' views have been unlinked and, ' + results[1] / 2 + ' rows have been updated (' + (currentTime - partStartTime) + 'ms)');
		}

		logger.info('schedule finished (' + (currentTime - overallStartTime) + 'ms)');

		return;
	})
	.catch(logger.error);

	return;
}, 60000);

//setInterval(function (): void {
//	prisma.$executeRawUnsafe('UPDATE movie_statistic, current_movie_statistic SET movie_statistic.comment_count = current_movie_statistic.comment_count, movie_statistic.like_count = current_movie_statistic.like_count, movie_statistic.star_average = current_movie_statistic.star_average WHERE movie_statistic.id = current_movie_statistic.id')
//	.then(function (affactedRowCount: number): void {
//		logger.debug(affactedRowCount + ' rows have been updated');

//		return;
//	})
//	.catch(logger.error);

//	return;
//}, 60000);

//setInterval(function (): void {
//	const movieIds: MovieStatistic['movieId'][] = [];
//	const keys: string[] = [];

//	new Promise<Set<string>>(function (resolve: ResolveFunction<Set<string>>, reject: RejectFunction): void {
//		const keys: Set<string> = new Set<string>();
//		let cursor: string = '0';

//		(function scanKeys(): Promise<void> {
//			return redis.scan(cursor, 'MATCH', 'movieView:*')
//			.then(function (results: [string, string[]]): Promise<void> | void {
//				for(let i: number = 0; i < results[1]['length']; i++) {
//					keys.add(results[1][i]);
//				}

//				if(results[0] !== '0') {
//					cursor = results[0];

//					return scanKeys();
//				} else {
//					resolve(keys);

//					return;
//				}
//			})
//			.catch(reject);
//		})();

//		return;
//	})
//	.then(function (_keys: Set<string>): Promise<(string | null)[]> | [] {
//		if(_keys['size'] !== 0) {
//			for(const key of _keys) {
//				movieIds.push(Number.parseInt(key.slice(10), 10));
//				keys.push(key);
//			}

//			return redis.mget(keys);
//		} else {
//			return [];
//		}
//	})
//	.then(function (results: (string | null)[]): Promise<[number, number]> | [number, number] {
//		if(results['length'] !== 0) {
//			const values: string[] = [];

//			for(let i: number = 0; i < results['length']; i++) {
//				if(results[i] !== null) {
//					values.push('((SELECT id FROM current_movie_statistic WHERE movie_id = ' + movieIds[i] + '), ' + results[i] + ')');
//				}
//			}

//			if(values['length'] !== 0) {
//				return Promise.all([redis.unlink(keys), prisma.$executeRawUnsafe('INSERT IGNORE INTO movie_statistic (id, view_count) VALUES ' + values.join(', ') + ' ON DUPLICATE KEY UPDATE view_count = view_count + VALUES(view_count)')]);
//			}
//		}

//		return [0, 0];
//	})
//	.then(function (results: [number, number]): void {
//		if(results[0] !== 0 || results[1] !== 0) {
//			logger.debug(results[0] + ' views have been unlinked and, ' + results[1] / 2 + ' rows have been updated');
//		}

//		return;
//	})
//	.catch(logger.error);

//	return;
//}, 60000);