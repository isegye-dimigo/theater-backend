import { kysely } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/error';
import { Database, Media, MediaVideo, Movie, Episode, Request, Response, User } from '@library/type';
import { InsertResult, Transaction, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
	};
	body: Pick<Episode, 'title' | 'description' | 'imageMediaId' | 'videoMediaId'>;
}>, response: Response): Promise<void> {
	if(request['user']['isVerified']) {
		return kysely.transaction()
		.setIsolationLevel('serializable')
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			let imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			let videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
				video: Pick<MediaVideo, 'id' | 'duration'>;
			};
			let episode: Pick<Episode, 'id' | 'index' | 'createdAt'>;

			return transaction.selectFrom('movie')
			.select('id')
			.where('id', '=', request['parameter']['movieId'])
			.where('is_deleted', '=', false)
			.executeTakeFirst()
			.then(function (movie?: Pick<Movie, 'id'>): Promise<(Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id' | 'duration'> & PrefixPick<Episode, 'episode_', 'id'>>)[]> {
				if(typeof(movie) !== 'undefined') {
					return transaction.selectFrom('media')
					.select(['media.id', 'media.hash', 'media.width', 'media.height'])
					.where('media.id', 'in', [request['body']['imageMediaId'], request['body']['videoMediaId']])
					.where('media.is_deleted', '=', false)
					.orderBy(sql`FIELD(media.id, ${request['body']['imageMediaId']}, ${request['body']['videoMediaId']})`)
					.leftJoin('media_video as video', 'media.id', 'video.media_id')
					.select(['video.id as video_id', 'video.duration as video_duration'])
					.leftJoin('episode', 'media.id', 'episode.video_media_id')
					.select('episode.id as episode_id')
					.execute();
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (medias: (Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'duration'> & PrefixPick<Episode, 'episode_', 'id'>>)[]): Promise<Pick<Episode, 'id' | 'index' | 'createdAt'>> {
				switch(medias['length']) {
					case 2: {
						if(medias[0]['video_duration'] === null) {
							if(medias[1]['video_duration'] !== null) {
								if(medias[1]['episode_id'] === null) {
									imageMedia = {
										id: medias[0]['id'],
										hash: medias[0]['hash'],
										width: medias[0]['width'],
										height: medias[0]['height']
									};
	
									videoMedia = {
										id: medias[1]['id'],
										hash: medias[1]['hash'],
										width: medias[1]['width'],
										height: medias[1]['height'],
										video: {
											id: medias[1]['id'],
											duration: medias[1]['video_duration']
										}
									};

									return transaction.insertInto('episode')
									.columns(['index', 'user_id', 'movie_id', 'title', 'description', 'image_media_id', 'video_media_id'])
									.expression(transaction.selectFrom('episode')
									// @ts-expect-error
									.select([sql`COALESCE(MAX(\`index\`) + 1, 0)`, sql.raw(String(request['user']['id'])), sql.raw(String(request['parameter']['movieId'])), sql.raw(request['body']['title']), sql.raw(request['body']['description']), sql.raw(String(request['body']['imageMediaId'])), sql.raw(String(request['body']['videoMediaId']))])
									.where('movie_id', '=', request['parameter']['movieId'])
									.where('is_deleted', '=', false))
									.returning(['id', 'index', 'created_at as createdAt'])
									.executeTakeFirstOrThrow();
								} else {
									throw new Conflict('Body[\'videoMediaId\'] must be unique');
								}
							} else {
								throw new BadRequest('Body[\'videoMediaId\'] must be video');
							}
						} else {
							throw new BadRequest('Body[\'imageMediaId\'] must not be video');
						}
					}

					case 1: {
						throw new BadRequest('Body[\'' + (medias[0]['id'] === request['body']['imageMediaId'] ? 'image' : 'video') + 'MediaId\'] must be valid');
					}

					default: {
						throw new BadRequest('Body[\'imageMediaId\'] must be valid');
					}
				}
			})
			.then(function (rawEpisode: Pick<Episode, 'id' | 'index' | 'createdAt'>): Promise<InsertResult> {
				episode = rawEpisode;

				return transaction.insertInto('episode_statistic')
				.values({
					episode_id: rawEpisode['id']
				})
				.executeTakeFirstOrThrow();
			})
			.then(function (result: InsertResult): Promise<Pick<User, 'handle' | 'name'>> {
				if(result['numInsertedOrUpdatedRows'] === 1n) {
					return transaction.selectFrom('user')
					.select(['handle', 'name'])
					.where('id', '=', request['user']['id'])
					.executeTakeFirstOrThrow();
				} else {
					throw new BadRequest('Episode[\'id\'] must be valid');
				}
			})
			.then(function (user: Pick<User, 'handle' | 'name'>): void {
				response.send({
					id: episode['id'],
					index: episode['index'],
					title: request['body']['title'],
					description: request['body']['description'],
					createdAt: episode['createdAt'],
					user: {
						id: request['user']['id'],
						handle: user['handle'],
						name: user['name'],
						isVerified: request['user']['isVerified']
					},
					imageMedia: imageMedia,
					videoMedia: videoMedia
				} satisfies Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & {
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
					imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
					videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
						video: Pick<MediaVideo, 'id' | 'duration'>;
					};
				});

				return;
			});
		});
	} else {
		throw new Unauthorized('User must be verified');
	}
}