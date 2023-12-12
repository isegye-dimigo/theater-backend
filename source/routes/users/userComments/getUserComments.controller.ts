import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Episode, EpisodeComment, Media, Movie, MovieComment, PageQuery, Request, Response, User } from '@library/type';
import { Transaction, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		userHandle: User['handle'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('user')
		.select('id')
		.where('handle', '=', request['parameter']['userHandle'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (user?: Pick<User, 'id'>): Promise<({
			id: EpisodeComment['id'] & MovieComment['id'];
			time: EpisodeComment['time'] | null;
			content: EpisodeComment['content'] & MovieComment['content'];
			createdAt: EpisodeComment['createdAt'] & MovieComment['createdAt'];
			target_id: Episode['id'] & Movie['id'];
			target_title: Episode['title'] & Movie['title'];
		} & PrefixPick<User, 'target_user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'target_media_', 'id' | 'hash' | 'width' | 'height'>)[]> {
			if(typeof(user) !== 'undefined') {
				if(request['user']['id'] === user['id']) {
					return transaction.selectFrom(transaction.selectFrom('episode_comment')
					.select(['episode_comment.id', 'episode_comment.time', 'episode_comment.content', 'episode_comment.created_at as createdAt'])
					.where('episode_comment.user_id', '=', request['user']['id'])
					.innerJoin('episode', 'episode_comment.episode_id', 'episode.id')
					.select(['episode.id as target_id', 'episode.user_id as target_user_id', 'episode.title as target_title', 'episode.image_media_id as target_media_id'])
					.unionAll(transaction.selectFrom('movie_comment')
					.select(['movie_comment.id', sql<number>`NULL`.as('time'), 'movie_comment.content', 'movie_comment.created_at as createdAt'])
					.where('movie_comment.user_id', '=', request['user']['id'])
					.innerJoin('movie', 'movie_comment.movie_id', 'movie.id')
					.select(['movie.id as target_id', 'movie.user_id as target_user_id', 'movie.title as target_title', 'movie.media_id as target_media_id'])).as('result'))
					.select(['result.id', 'result.time', 'result.content', 'result.createdAt', 'result.target_id', 'result.target_title'])
					.innerJoin('user as target_user', 'result.target_user_id', 'target_user.id')
					.select(['target_user.id as target_user_id', 'target_user.handle as target_user_handle', 'target_user.name as target_user_name', 'target_user.is_verified as target_user_isVerified'])
					.innerJoin('media as target_media', 'result.target_media_id', 'target_media.id')
					.select(['target_media.id as target_media_id', 'target_media.hash as target_media_hash', 'target_media.width as target_media_width', 'target_media.height as target_media_height'])
					.orderBy('result.createdAt')
					.execute();
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(function (rawComments: ({
			id: EpisodeComment['id'] & MovieComment['id'];
			time: EpisodeComment['time'] | null;
			content: EpisodeComment['content'] & MovieComment['content'];
			createdAt: EpisodeComment['createdAt'] & MovieComment['createdAt'];
			target_id: Episode['id'] & Movie['id'];
			target_title: Episode['title'] & Movie['title'];
		} & PrefixPick<User, 'target_user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'target_media_', 'id' | 'hash' | 'width' | 'height'>)[]): void {
			const comments: ({
				id: EpisodeComment['id'] & MovieComment['id'];
				content: EpisodeComment['content'] & MovieComment['content'];
				createdAt: EpisodeComment['createdAt'] & MovieComment['createdAt'];
			} & ({
				movie: {
					id: Episode['id'] & Movie['id'];
					title: Episode['title'] & Movie['title'];
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
					media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			} | {
				time: EpisodeComment['time'];
				episode: {
					id: Episode['id'] & Movie['id'];
					title: Episode['title'] & Movie['title'];
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
					imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			}))[] = [];

			for(let i: number = 0; i < rawComments['length']; i++) {
				const isEpisode: boolean = rawComments[i]['time'] !== null;

				// @ts-expect-error
				comments.push(Object.assign({
					id: rawComments[i]['id']
				}, isEpisode ? {
					time: Number(rawComments[i]['time'])
				} : undefined, {
					content: rawComments[i]['content'],
					createdAt: rawComments[i]['createdAt'],
					[isEpisode ? 'episode' : 'movie']: {
						id: rawComments[i]['target_id'],
						title: rawComments[i]['target_title'],
						user: {
							id: rawComments[i]['target_user_id'],
							handle: rawComments[i]['target_user_handle'],
							name: rawComments[i]['target_user_name'],
							isVerified: rawComments[i]['target_user_isVerified']
						},
						[isEpisode ? 'imageMedia' : 'media']: {
							id: rawComments[i]['target_media_id'],
							hash: rawComments[i]['target_media_hash'],
							width: rawComments[i]['target_media_width'],
							height: rawComments[i]['target_media_height']
						}
					}
				}));
			}

			response.send(comments);

			return;
		});
	});
}