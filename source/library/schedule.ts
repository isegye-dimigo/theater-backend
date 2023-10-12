import { Movie, MovieStatistic } from '@prisma/client';
import { elasticsearch, getKeys, prisma, redis } from '@library/database';
import { logger } from '@library/logger';
import { BulkResponse, BulkUpdateAction } from '@elastic/elasticsearch/lib/api/types';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { createPool, Pool, PoolConnection } from 'mariadb';

const pool: Pool = createPool('mariadb' + process['env']['DATABASE_URL'].slice(5));

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
			let query: string = '';
			
			for(let i: number = 0; i < results['length']; i++) {
				if(results[i] !== null) {
					query += 'UPDATE movie_statistic, current_movie_statistic SET movie_statistic.view_count = movie_statistic.view_count + ' + results[i] + ' WHERE current_movie_statistic.movie_id = ' + movieIds[i] + ' AND movie_statistic.id = current_movie_statistic.id;';
				}
			}

			if(query['length'] !== 0) {
				return Promise.all([redis.unlink(keys), pool.getConnection()
				.then(function (connection: PoolConnection): Promise<number> {
					return connection.execute('START TRANSACTION WITH CONSISTENT SNAPSHOT;' + query + 'COMMIT')
					.then(function (resultCount: number): Promise<number> {
						return connection.release()
						.then(function (): number {
							return resultCount;
						});
					})
					.catch(function (error: Error): Promise<number> {
						return connection.execute('ROLLBACK')
						.then(function (): Promise<void> {
							return connection.release();
						})
						.then(function (): number {
							throw error;
						});
					});
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
	.then(function (results: (string | null)[]): Promise<[number, BulkResponse]> | [number, BulkResponse] {
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
			})]);
		} else {
			return [0, {
				errors: false,
				items: [],
				took: 0
			}];
		}
	})
	.then(function (reuslts: [number, BulkResponse]) {
		if(!reuslts[1]['errors']) {
			logger.debug(reuslts[0] + ' views have been unlinked, and ' + reuslts[1]['items']['length'] + ' indexes have been updated (' + (Date.now() - startTime) + 'ms)');
			
			return;
		} else {
			throw new Error('Elasticsearch');
		}
	})
	.catch(logger.error.bind(logger));

	return;
}, 300000);