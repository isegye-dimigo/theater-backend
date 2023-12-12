import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Episode, Movie, EpisodeStatistic, PageQuery, Request, Response } from '@library/type';
import { JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
		episodeId: EpisodeStatistic['episodeId'];
		episodeStatisticId: EpisodeStatistic['id'];
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
		.leftJoin('episode_statistic', function (joinBuilder: JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
		}, 'episode' | 'episode_statistic'>): JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
		}, 'episode' | 'episode_statistic'> {
			return joinBuilder.onRef('episode.id', '=', 'episode_statistic.episode_id')
			.on('episode_statistic.id', '=', request['parameter']['episodeStatisticId']);
		})
		.select('episode_statistic.id as episode_statistic_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie , 'userId'> & Nullable<PrefixPick<Episode, 'episode_', 'userId'> & PrefixPick<EpisodeStatistic, 'episode_statistic_', 'id'>>): Promise<Pick<EpisodeStatistic, 'id' | 'viewCount' | 'commentCount' | 'likeCount' | 'createdAt'>> {
			if(typeof(movie) !== 'undefined') {
				if(request['user']['id'] === movie['userId']) {
					if(movie['episode_userId'] !== null) {
						if(movie['episode_statistic_id'] !== null) {
							if(request['user']['id'] === movie['episode_userId']) {
								return transaction.selectFrom('episode_statistic')
								.select(['id', 'view_count as viewCount', 'comment_count as commentCount', 'like_count as likeCount', 'created_at as createdAt'])
								.where('episode_id', '=', request['parameter']['episodeId'])
								.executeTakeFirstOrThrow();
							} else {
								throw new Unauthorized('User must be same');
							}
						} else {
							throw new NotFound('Parameter[\'episodeStatisticId\'] must be valid');
						}
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(response.send.bind(response));
	});
}