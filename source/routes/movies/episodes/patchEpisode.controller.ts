import { kysely } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/error';
import { Database, Media, MediaVideo, Movie, Episode, Request, Response, User } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { JoinBuilder, Transaction, UpdateResult, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
		episodeId: Episode['id'];
	};
	body: Partial<Pick<Episode, 'index' | 'title' | 'description' | 'imageMediaId'>>;
}>, response: Response): Promise<void> {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			return kysely.transaction()
			.setIsolationLevel('serializable')
			.execute(function (transaction: Transaction<Database>): Promise<void> {
				let imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
				let episodeIndex: Episode['index'] | undefined;

				return transaction.selectFrom('movie')
				.select('movie.user_id as userId')
				.where('movie.id', '=', request['parameter']['movieId'])
				.where('movie.is_deleted', '=', false)
				.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
					return joinBuilder.onRef('movie.id', '=', 'episode.movie_id')
					.on('episode.id', '=', request['parameter']['episodeId'])
					.on('episode.is_deleted', '=', false);
				})
				.select(['episode.user_id as episode_userId', 'episode.index as episode_index'])
				.executeTakeFirst()
				.then(function (movie?: Pick<Movie, 'userId'> & Nullable<PrefixPick<Episode, 'episode_', 'userId' | 'index'>>): Promise<void[]> {
					if(typeof(movie) !== 'undefined') {
						if(request['user']['id'] === movie['userId']) {
							if(movie['episode_userId'] !== null) {
								if(request['user']['id'] === movie['episode_userId']) {
									const validationPromises: Promise<void>[] = [];

									if(typeof(request['body']['index']) === 'number' && request['body']['index'] !== movie['episode_index']) {
										episodeIndex = movie['episode_index'] as number;

										if(request['body']['index'] >= 0) {
											validationPromises.push(transaction.selectFrom('episode')
											.select(transaction['fn'].max('index').as('index'))
											.where('movie_id', '=', request['parameter']['movieId'])
											.where('episode.is_deleted', '=', false)
											.executeTakeFirst()
											.then(function (episode?: Pick<Episode, 'index'>): void {
												if(typeof(episode) !== 'undefined' && request['body']['index'] as number <= episode['index']) {
													return;
												} else {
													throw new BadRequest('Body[\'index\'] must be valid');
												}
											}));
										} else {
											throw new BadRequest('Body[\'index\'] must be valid');
										}
									}

									if(typeof(request['body']['imageMediaId']) === 'number') {
										validationPromises.push(transaction.selectFrom('media')
										.select(['media.id', 'media.hash', 'media.width', 'media.height'])
										.where('media.id', '=', request['body']['imageMediaId'])
										.where('media.is_deleted', '=', false)
										.leftJoin('media_video as video', 'media.id', 'video.media_id')
										.select('video.id as video_id')
										.executeTakeFirst()
										.then(function (media?: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id'>>): void {
											if(typeof(media) !== 'undefined') {
												if(media['video_id'] === null) {
													imageMedia = {
														id: media['id'],
														hash: media['hash'],
														width: media['width'],
														height: media['height']
													};

													return;
												} else {
													throw new BadRequest('Body[\'imageMediaId\'] must not be video');
												}
											} else {
												throw new BadRequest('Body[\'imageMediaId\'] must be valid');
											}
										}));
									}
									
									return resolveInSequence<void[]>(validationPromises);
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
				.then(function (): Promise<UpdateResult[]> {
					const updatePromises: Promise<UpdateResult>[] = [transaction.updateTable('episode')
					.set({
						index: request['body']['index'],
						title: request['body']['title'],
						description: request['body']['description'],
						image_media_id: request['body']['imageMediaId']
					})
					.where('id', '=', request['parameter']['episodeId'])
					.executeTakeFirst()];

					if(typeof(episodeIndex) === 'number') {
						const isIndexBigger = episodeIndex > (request['body']['index'] as number);

						updatePromises.push(transaction.updateTable('episode')
						.set({
							index: sql.raw('`index` ' + (isIndexBigger ? '+' : '-') + ' 1')
						})
						.where('movie_id', '=', request['parameter']['movieId'])
						.where('is_deleted', '=', false)
						.where('id', '!=', request['parameter']['episodeId'])
						.where(sql.raw('`index` ' + (isIndexBigger ? '>=' : '<=') + ' ' + request['body']['index'] + ' AND `index` ' + (isIndexBigger ? '<' : '>') + ' ' + episodeIndex + ' ORDER BY `index` ' + (isIndexBigger ? 'DESC' : 'ASC')))
						.executeTakeFirst());
					}

					return resolveInSequence(updatePromises);
				})
				.then(function (result: UpdateResult[]): void {
					if(result[0]['numUpdatedRows'] === 1n) {
						response.send({
							id: request['parameter']['episodeId'],
							index: request['body']['index'],
							title: request['body']['title'],
							description: request['body']['description'],
							imageMedia: imageMedia
						} satisfies Pick<Episode, 'id'> & Partial<Pick<Episode, 'index' | 'title' | 'description'> & {
							imageMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
						}>);

						return;
					} else {
						throw new NotFound('Parameter[\'episodeId\'] must be valid');
					}
				});
			});
		} else {
			throw new BadRequest('Body must have more than one key');
		}
	} else {
		throw new Unauthorized('User must be verified');
	}
}