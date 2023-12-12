import { kysely } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/error';
import { Database, Episode, Media, MediaVideo, Request, Response, User, UserHistory } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		userHandle: User['handle'];
	};
	body: Pick<UserHistory, 'episodeId' | 'time'>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		let history: Pick<UserHistory, 'id' | 'createdAt'>;

		return resolveInSequence<[Pick<User, 'id'> | undefined, Pick<Episode, 'id'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'duration'> | undefined]>([transaction.selectFrom('user')
		.select('id')
		.where('handle', '=', request['parameter']['userHandle'])
		.where('is_deleted', '=', false)
		.executeTakeFirst(), transaction.selectFrom('episode')
		.select('episode.id')
		.where('episode.id', '=', request['body']['episodeId'])
		.where('episode.is_deleted', '=', false)
		.innerJoin('media_video as videoMedia_video', 'episode.video_media_id', 'videoMedia_video.media_id')
		.select('videoMedia_video.duration as videoMedia_video_duration')
		.executeTakeFirst()])
		.then(function (userAndEpisode: [Pick<User, 'id'> | undefined, Pick<Episode, 'id'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'duration'> | undefined]): Promise<Pick<UserHistory, 'id' | 'createdAt'>> {
			if(typeof(userAndEpisode[0]) !== 'undefined') {
				if(request['user']['id'] === userAndEpisode[0]['id']) {
					if(typeof(userAndEpisode[1]) !== 'undefined') {
						if(request['body']['time'] <= userAndEpisode[1]['videoMedia_video_duration']) {
							return transaction.insertInto('user_history')
							.values({
								episode_id: request['body']['episodeId'],
								user_id: request['user']['id'],
								time: request['body']['time']
							})
							.returning(['id', 'created_at as createdAt'])
							.executeTakeFirstOrThrow();
						} else {
							throw new BadRequest('Body[\'time\'] must be valid');
						}
					} else {
						throw new BadRequest('Body[\'episodeId\'] must be valid');
					}
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(function (rawHistory: Pick<UserHistory, 'id' | 'createdAt'>): Promise<Pick<Episode, 'id' | 'title'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>> {
			history = rawHistory;

			return transaction.selectFrom('episode')
			.select(['episode.id', 'episode.title'])
			.innerJoin('user', 'episode.user_id', 'user.id')
			.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
			.innerJoin('media as imageMedia', 'episode.image_media_id', 'imageMedia.id')
			.select(['imageMedia.id as imageMedia_id', 'imageMedia.hash as imageMedia_hash', 'imageMedia.width as imageMedia_width', 'imageMedia.height as imageMedia_height'])
			.executeTakeFirstOrThrow();
		})
		.then(function (episode: Pick<Episode, 'id' | 'title'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>): void {
			response.send({
				id: history['id'],
				time: request['body']['time'],
				createdAt: history['createdAt'],
				episode: {
					id: episode['id'],
					title: episode['title'],
					user: {
						id: episode['user_id'],
						handle: episode['user_handle'],
						name: episode['user_name'],
						isVerified: episode['user_isVerified']
					},
					imageMedia: {
						id: episode['imageMedia_id'],
						hash: episode['imageMedia_hash'],
						width: episode['imageMedia_width'],
						height: episode['imageMedia_height']
					}
				}
			} satisfies Pick<UserHistory, 'id' | 'time' | 'createdAt'> & {
				episode: Pick<Episode, 'id' | 'title'> & {
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
					imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			});

			return;
		});
	});
}