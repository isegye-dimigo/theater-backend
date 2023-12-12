import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Media, Movie, EpisodeComment, Episode, PageQuery, Request, Response, User } from '@library/type';
import { JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
		episodeId: EpisodeComment['episodeId'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.id')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
			return joinBuilder.onRef('movie.id', '=', 'episode.movie_id')
			.on('episode.id', '=', request['parameter']['episodeId'])
			.on('episode.is_deleted', '=', false);
		})
		.select('episode.id as episode_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'>>): Promise<(Pick<EpisodeComment, 'id' | 'time' | 'content' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>>)[]> {
			if(typeof(movie) !== 'undefined') {
				if(movie['episode_id'] !== null) {
					return transaction.selectFrom('episode_comment')
					.select(['episode_comment.id', 'episode_comment.time', 'episode_comment.content', 'episode_comment.created_at as createdAt'])
					.where('episode_comment.episode_id', '=', request['parameter']['episodeId'])
					.where('episode_comment.is_deleted', '=', false)
					.orderBy('episode_comment.id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
					.limit(request['query']['page[size]'])
					.offset(request['query']['page[size]'] * request['query']['page[index]'])
					.innerJoin('user', 'episode_comment.user_id', 'user.id')
					.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
					.leftJoin('media as user_profileMedia', 'user.profile_media_id', 'user_profileMedia.id')
					.select(['user_profileMedia.id as user_profileMedia_id', 'user_profileMedia.hash as user_profileMedia_hash', 'user_profileMedia.width as user_profileMedia_width', 'user_profileMedia.height as user_profileMedia_height'])
					.execute();
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (rawComments: (Pick<EpisodeComment, 'id' | 'time' | 'content' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>>)[]): void {
			const comments: (Pick<EpisodeComment, 'id' | 'time' | 'content' | 'createdAt'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
					profileMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			})[] = [];

			for(let i: number = 0; i < rawComments['length']; i++) {
				comments.push({
					id: rawComments[i]['id'],
					time: rawComments[i]['time'],
					content: rawComments[i]['content'],
					createdAt: rawComments[i]['createdAt'],
					user: Object.assign({
						id: rawComments[i]['user_id'],
						handle: rawComments[i]['user_handle'],
						name: rawComments[i]['user_name'],
						isVerified: rawComments[i]['user_isVerified']
					}, rawComments[i]['user_profileMedia_id'] !== null ? {
						profileMedia: {
							id: rawComments[i]['user_profileMedia_id']  as number,
							hash: rawComments[i]['user_profileMedia_hash'] as string,
							width: rawComments[i]['user_profileMedia_width'] as number,
							height: rawComments[i]['user_profileMedia_height'] as number
						}
					} as const : undefined)
				});
			}

			response.send(comments);
			
			return;
		});
	});
}