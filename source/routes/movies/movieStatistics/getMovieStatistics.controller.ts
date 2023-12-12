import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, MovieStatistic, PageQuery, Request, Response } from '@library/type';
import { Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieStatistic['movieId'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.user_id as userId')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'userId'>): Promise<Pick<MovieStatistic, 'id' | 'viewCount' | 'commentCount' | 'starAverage' | 'createdAt'>[]> {
			if(typeof(movie) !== 'undefined') {
				if(request['user']['id'] === movie['userId']) {
					return transaction.selectFrom('movie_statistic')
					.select(['id', 'view_count as viewCount', 'comment_count as commentCount', 'star_average as starAverage', 'created_at as createdAt'])
					.where('movie_id', '=', request['parameter']['movieId'])
					.orderBy('id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
					.limit(request['query']['page[size]'])
					.offset(request['query']['page[size]'] * request['query']['page[index]'])
					.execute();
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(response.send.bind(response));
	});
}