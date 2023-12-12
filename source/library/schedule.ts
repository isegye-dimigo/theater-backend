import { elasticsearch, getKeys, kysely, redis } from '@library/database';
import { BulkResponse, BulkUpdateAction } from '@elastic/elasticsearch/lib/api/types';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Database, EpisodeStatistic, Movie, MovieStatistic } from '@library/type';
import { resolveInSequence } from '@library/utility';
import Logger from '@library/logger';
import { QueryResult, Transaction, sql } from 'kysely';

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
	.then(function (results: (string | null)[]): Promise<[bigint, number]> | [bigint, number] {
		if(results['length'] !== 0) {
			return kysely.transaction()
			.setIsolationLevel('serializable')
			.execute(function (transaction: Transaction<Database>): Promise<[bigint, number]> {
					const updatePromises: Promise<QueryResult<unknown>>[] = [];
		
					for(let i: number = 0; i < results['length']; i++) {
						updatePromises.push(sql.raw('UPDATE `movie_statistic` INNER JOIN `current_movie_statistic` ON `movie_statistic`.`id` = `current_movie_statistic`.`id` SET `view_count` = `movie_statistic`.`view_count` + ' + results[i] + ' WHERE `current_movie_statistic`.`movie_id` = ' + movieIds[i]).execute(transaction));
					}
		
					return resolveInSequence<[bigint, number]>([resolveInSequence(updatePromises)
					.then(function (results: QueryResult<unknown>[]): bigint {
						let count: bigint = 0n;
	
						for(let i: number = 0; i < results['length']; i++) {
							count += results[i]['numChangedRows'] as bigint;
						}
	
						return count;
					}), redis.unlink(keys)]);
			});
		} else {
			return [0n, 0];
		}
	})
	.then(function (results: [bigint, number]): void {
		Logger['logger'].debug('[MovieView] ' + results[0] + ' rows have been updated, and ' + results[1] + ' views have been unlinked (' + (Date.now() - startTime) + 'ms)');

		return;
	})
	.catch(Logger['logger'].error);

	return;
}, 300000);

global.setInterval(function (): void {
	const startTime: number = Date.now();
	const episodeIds: EpisodeStatistic['episodeId'][] = [];
	const keys: string[] = [];

	getKeys('episodeView:*')
	.then(function (_keys: Set<string>): Promise<(string | null)[]> | [] {
		if(_keys['size'] !== 0) {
			for(const key of _keys) {
				episodeIds.push(Number.parseInt(key.slice(12), 10));
				
				keys.push(key);
			}

			return redis.mget(keys);
		} else {
			return [];
		}
	})
	.then(function (results: (string | null)[]): Promise<[bigint, number]> | [bigint, number] {
		if(results['length'] !== 0) {
			return kysely.transaction()
			.setIsolationLevel('serializable')
			.execute(function (transaction: Transaction<Database>): Promise<[bigint, number]> {
					const updatePromises: Promise<QueryResult<unknown>>[] = [];
		
					for(let i: number = 0; i < results['length']; i++) {
						updatePromises.push(sql.raw('UPDATE `episode_statistic` INNER JOIN `current_episode_statistic` ON `episode_statistic`.`id` = `current_episode_statistic`.`id` SET `view_count` = `episode_statistic`.`view_count` + ' + results[i] + ' WHERE `current_episode_statistic`.`episode_id` = ' + episodeIds[i]).execute(transaction));
					}
		
					return resolveInSequence<[bigint, number]>([resolveInSequence(updatePromises)
					.then(function (results: QueryResult<unknown>[]): bigint {
						let count: bigint = 0n;
	
						for(let i: number = 0; i < results['length']; i++) {
							count += results[i]['numChangedRows'] as bigint;
						}
	
						return count;
					}), redis.unlink(keys)]);
			});
		} else {
			return [0n, 0];
		}
	})
	.then(function (results: [bigint, number]): void {
		Logger['logger'].debug('[EpisodeView] ' + results[0] + ' rows have been updated, and ' + results[1] + ' views have been unlinked (' + (Date.now() - startTime) + 'ms)');

		return;
	})
	.catch(Logger['logger'].error);

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

			return resolveInSequence<[number, number]>([elasticsearch.bulk({
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
			}), redis.unlink(keys)]);
		} else {
			return [0, 0];
		}
	})
	.then(function (reuslts: [number, number]) {
		Logger['logger'].debug('[MovieIndex] ' + reuslts[1] + ' indexes have been updated, and ' + reuslts[0] + ' views have been unlinked (' + (Date.now() - startTime) + 'ms)');
		
		return;
	})
	.catch(Logger['logger'].error);

	return;
}, 300000);