import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Episode, Movie, EpisodeStatistic, PageQuery, Request, Response } from '@library/type';
import { JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
		episodeId: EpisodeStatistic['episodeId'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.user_id as userId')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
			return joinBuilder.onRef('movie.id', '=', 'episode.movie_id')
			.on('episode.id', '=', request['parameter']['episodeId'])
			.on('episode.is_deleted', '=', false);
		})
		.select('episode.user_id as episode_userId')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie , 'userId'> & Nullable<PrefixPick<Episode, 'episode_', 'userId'>>): Promise<Pick<EpisodeStatistic, 'id' | 'viewCount' | 'commentCount' | 'likeCount' | 'createdAt'>[]> {
			if(typeof(movie) !== 'undefined') {
				if(request['user']['id'] === movie['userId']) {
					if(movie['episode_userId'] !== null) {
						if(request['user']['id'] === movie['episode_userId']) {
							return transaction.selectFrom('episode_statistic')
							.select(['id', 'view_count as viewCount', 'comment_count as commentCount', 'like_count as likeCount', 'created_at as createdAt'])
							.where('episode_id', '=', request['parameter']['episodeId'])
							.orderBy('id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
							.limit(request['query']['page[size]'])
							.offset(request['query']['page[size]'] * request['query']['page[index]'])
							.execute();
						} else {
							throw new Unauthorized('User must be same');
						}
					} else {
						throw new NotFound('Parameter[\'episodeId\'] must be valid');
					}
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