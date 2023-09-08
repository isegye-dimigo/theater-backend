import { MovieStatistic } from '@prisma/client';
import { prisma, redis } from '@library/database';
import Logger from '@library/logger';

const logger: Logger = new Logger();

setInterval(function (): void {
	logger.debug('schedule started');
	const movieViewKeys: string[] = [];
	const movieStatisticIds: MovieStatistic['id'][] = [];
	let transaction: string | undefined;

	prisma.$queryRawUnsafe<Record<'f0' | 'f1', BigInt>[]>('INSERT INTO movie_statistic (movie_id, view_count, like_count, comment_count, star_average) SELECT movie_statistic.movie_id, movie_statistic.view_count, COUNT(movie_like.id), COUNT(movie_comment.id), COALESCE(AVG(movie_star.value), 0) FROM movie_statistic LEFT JOIN movie_like ON movie_statistic.movie_id = movie_like.movie_id LEFT JOIN movie_comment ON movie_statistic.movie_id = movie_comment.movie_id LEFT JOIN movie_star ON movie_statistic.movie_id = movie_star.movie_id INNER JOIN (SELECT MAX(id) AS id FROM movie_statistic GROUP BY movie_id) AS _movie_statistic ON movie_statistic.id = _movie_statistic.id WHERE movie_statistic.created_at <= NOW() - INTERVAL 10 MINUTE GROUP BY movie_statistic.movie_id RETURNING movie_statistic.id, movie_statistic.movie_id')
	.then(function (results: Record<'f0' | 'f1', BigInt>[]): Promise<(string | null)[]> | undefined {
		for(let i: number = 0; i < results['length']; i++) {
			movieStatisticIds.push(Number(results[i]['f0']));

			movieViewKeys.push('movieView:' + results[i]['f1'].toString(10));
		}

		if(movieViewKeys['length'] !== 0) {
			return redis.mget(movieViewKeys);
		} else {
			return;
		}
	})
	.then(function (results: (string | null)[] | undefined): Promise<number> | undefined {
		if(Array.isArray(results)) {
			let queryCount: number = 0;
			transaction = 'BEGIN NOT ATOMIC DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING BEGIN ROLLBACK;END;START TRANSACTION;';

			for(let i: number = 0; i < results['length']; i++) {
				if(typeof(results[i]) === 'string') {
					transaction += 'UPDATE movie_statistic SET view_count = view_count + ' + results[i] + ' WHERE id = ' + movieStatisticIds[i] + ';';
					queryCount++;
				}
			}
	
			if(queryCount !== 0) {
				transaction += 'COMMIT;END';
			} else {
				transaction = undefined;
			}
	
			return redis.del(movieViewKeys);
		} else {
			return;
		}
	})
	.then(function (): Promise<number> | number {
		if(typeof(transaction) === 'string') {
			return prisma.$executeRawUnsafe(transaction);
		} else {
			return 0;
		}
	})
	.then(function (affectedRowCount: number): void {
		logger.debug(affectedRowCount + ' rows has affacted');
	})
	.catch(logger.error);

	return;
}, 60000);