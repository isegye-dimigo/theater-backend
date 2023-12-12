import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Episode, Media, MediaVideo, PageQuery, Request, Response, User, UserHistory } from '@library/type';
import { JoinBuilder, Transaction } from 'kysely';

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
		.then(function (user?: Pick<User, 'id'>): Promise<(Pick<UserHistory, 'id' | 'time' | 'createdAt'> & PrefixPick<Episode, 'episode_', 'id' | 'title'> & PrefixPick<User, 'episode_user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<MediaVideo, 'episode_videoMedia_video_', 'duration'> & PrefixPick<Media, 'episode_imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]> {
			if(typeof(user) !== 'undefined') {
				if(request['user']['id'] === user['id']) {
					return transaction.selectFrom('user_history')
					.select(['user_history.id', 'user_history.time', 'user_history.created_at as createdAt'])
					.orderBy('user_history.id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
					.limit(request['query']['page[size]'])
					.offset(request['query']['page[size]'] * request['query']['page[index]'])
					.innerJoin('episode', function (joinBuilder: JoinBuilder<Database, 'user_history' | 'episode'>): JoinBuilder<Database, 'user_history' | 'episode'> {
						return joinBuilder.onRef('user_history.episode_id', '=', 'episode.id')
						.on('episode.is_deleted', '=', false);
					})
					.select(['episode.id as episode_id', 'episode.title as episode_title'])
					.innerJoin('user as episode_user', 'episode.user_id', 'episode_user.id')
					.select(['episode_user.id as episode_user_id', 'episode_user.handle as episode_user_handle', 'episode_user.name as episode_user_name', 'episode_user.is_verified as episode_user_isVerified'])
					.innerJoin('media_video as episode_videoMedia_video', 'episode.video_media_id', 'episode_videoMedia_video.media_id')
					.select('episode_videoMedia_video.duration as episode_videoMedia_video_duration')
					.innerJoin('media as episode_imageMedia', 'episode.image_media_id', 'episode_imageMedia.id')
					.select(['episode_imageMedia.id as episode_imageMedia_id', 'episode_imageMedia.hash as episode_imageMedia_hash', 'episode_imageMedia.width as episode_imageMedia_width', 'episode_imageMedia.height as episode_imageMedia_height'])
					.execute();
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(function (rawHistories: (Pick<UserHistory, 'id' | 'time' | 'createdAt'> & PrefixPick<Episode, 'episode_', 'id' | 'title'> & PrefixPick<User, 'episode_user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<MediaVideo, 'episode_videoMedia_video_', 'duration'> & PrefixPick<Media, 'episode_imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]): void {
			const histories: (Pick<UserHistory, 'id' | 'time' | 'createdAt'> & {
				episode: Pick<Episode, 'id' | 'title'> & {
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
					videoMedia: {
						video: Pick<MediaVideo, 'duration'>;
					};
					imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			})[] = [];

			for(let i: number = 0; i < rawHistories['length']; i++) {
				histories.push({
					id: rawHistories[i]['id'],
					time: rawHistories[i]['time'],
					createdAt: rawHistories[i]['createdAt'],
					episode: {
						id: rawHistories[i]['episode_id'],
						title: rawHistories[i]['episode_title'],
						user: {
							id: rawHistories[i]['episode_user_id'],
							handle: rawHistories[i]['episode_user_handle'],
							name: rawHistories[i]['episode_user_name'],
							isVerified: rawHistories[i]['episode_user_isVerified']
						},
						videoMedia: {
							video: {
								duration: rawHistories[i]['episode_videoMedia_video_duration']
							}
						},
						imageMedia: {
							id: rawHistories[i]['episode_imageMedia_id'],
							hash: rawHistories[i]['episode_imageMedia_hash'],
							width: rawHistories[i]['episode_imageMedia_width'],
							height: rawHistories[i]['episode_imageMedia_height']
						}
					}
				});
			}

			response.send(histories);

			return;
		});
	});
}