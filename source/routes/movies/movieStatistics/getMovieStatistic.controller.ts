import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, MovieStatistic, Request, Response } from '@library/type';
import { JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieStatistic['movieId'];
		movieStatisticId: MovieStatistic['id'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.user_id as userId')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('movie_statistic as statistic', function (joinBuilder: JoinBuilder<Database & {
			statistic: Database['movie_statistic'];
		}, 'movie' | 'statistic'>): JoinBuilder<Database & {
			statistic: Database['movie_statistic'];
		}, 'movie' | 'statistic'> {
			return joinBuilder.onRef('statistic.movie_id', '=', 'movie.id')
			.on('statistic.id', '=', request['parameter']['movieStatisticId']);
		})
		.select('statistic.id as statistic_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'userId'> & Nullable<PrefixPick<MovieStatistic, 'statistic_', 'id'>>): Promise<Pick<MovieStatistic, 'id' | 'viewCount' | 'commentCount' | 'starAverage' | 'createdAt'>> {
			if(typeof(movie) !== 'undefined') {
				if(movie['statistic_id'] !== null) {
					if(request['user']['id'] === movie['userId']) {
						return transaction.selectFrom('movie_statistic')
						.select(['id', 'view_count as viewCount', 'comment_count as commentCount', 'star_average as starAverage', 'created_at as createdAt'])
						.where('id', '=', request['parameter']['movieStatisticId'])
						.executeTakeFirstOrThrow();
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieStatisticId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(response.send.bind(response));
	});
}