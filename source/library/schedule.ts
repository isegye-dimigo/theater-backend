import { Movie, MovieStatistic, Prisma } from '@prisma/client';
import { elasticsearch, getKeys, prisma, redis } from '@library/database';
import { logger } from '@library/logger';
import { BulkResponse, BulkUpdateAction } from '@elastic/elasticsearch/lib/api/types';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';

global.setInterval(function (): void {
	const startTime: number = Date.now();
	const movieIds: MovieStatistic['movieId'][] = [];
	const keys: string[] = [];

	getKeys('movieView:*')
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
			const updatePromises: Prisma.PrismaPromise<number>[] = [];

			for(let i: number = 0; i < results['length']; i++) {
				if(results[i] !== null) {
					updatePromises.push(prisma.$executeRawUnsafe('UPDATE movie_statistic, current_movie_statistic SET movie_statistic.view_count = movie_statistic.view_count + ' + results[i] + ' WHERE current_movie_statistic.movie_id = ' + movieIds[i] + ' AND movie_statistic.id = current_movie_statistic.id;'));
				}
			}

			if(updatePromises['length'] !== 0) {
				return Promise.all([redis.unlink(keys), prisma.$transaction(updatePromises)
				.then(function (resultCounts: number[]): number {
					let resultCount: number = 0;
	
					for(let i: number = 0; i < resultCounts['length']; i++) {
						resultCount += resultCounts[i];
					}
	
					return resultCount;
				})]);
			}
		}

		return [0, 0];
	})
	.then(function (results: [number, number]): void {
		logger.debug(results[0] + ' views have been unlinked, and ' + results[1] / 2 + ' rows have been updated (' + (Date.now() - startTime) + 'ms)');

		return;
	})
	.catch(logger.error.bind(logger));

	return;
}, 300000);

global.setInterval(function (): void {
	const startTime: number = Date.now();
	const movies: (Pick<Movie, 'id'> & {
		state: string
	})[] = [];
	const keys: string[] = [];

	getKeys('movieIndex:*')
	.then(function (_keys: Set<string>): Promise<(string | null)[]> | [] {
		if(_keys['size'] !== 0) {
			for(const key of _keys) {
				movies.push({
					id: Number.parseInt(key.slice(18), 10),
					state: key.slice(11, 17)
				});

				keys.push(key);
			}

			return redis.mget(keys);
		} else {
			return [];
		}
	})
	.then(function (results: (string | null)[]): Promise<[number, number]> | [number, number] {
		if(results['length'] !== 0) {
			const operations: (BulkOperationContainer | Partial<Pick<Movie, 'title' | 'description'>> | BulkUpdateAction<Pick<Movie, 'title' | 'description'>, Partial<Pick<Movie, 'title' | 'description'>>>)[] = [];

			for(let i: number = 0; i < movies['length']; i++) {
				if(results[i] !== null) {
					operations.push({
						[movies[i]['state']]: {
							_id: movies[i]['id'].toString(10)
						}
					});

					switch(movies[i]['state']) {
						case 'create': {
							operations.push(JSON.parse(results[i] as string));

							break;
						}
						case 'update': {
							operations.push({
								doc: JSON.parse(results[i] as string)
							});

							break;
						}
					}
				}
			}

			return Promise.all([redis.unlink(keys), elasticsearch.bulk({
				index: 'movie',
				_source: false,
				operations: operations
			})
			.then(function (bulkResponse: BulkResponse): number {
				if(!bulkResponse['errors']) {
					return bulkResponse['items']['length'];
				} else {
					throw new Error('Elasticsearch');
				}
			})]);
		} else {
			return [0, 0];
		}
	})
	.then(function (reuslts: [number, number]) {
		logger.debug(reuslts[0] + ' views have been unlinked, and ' + reuslts[1] + ' indexes have been updated (' + (Date.now() - startTime) + 'ms)');
		
		return;
	})
	.catch(logger.error.bind(logger));

	return;
}, 300000);