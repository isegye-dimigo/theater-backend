import { CATEGORYS } from '@library/constant';
import { kysely, redis } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/error';
import { Category, Database, Media, MediaVideo, Movie, Request, Response } from '@library/type';
import { Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
	};
	body: Partial<Pick<Movie, 'title' | 'description' | 'mediaId' | 'categoryId'>>;
}>, response: Response): Promise<void> {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			return kysely.transaction()
			.setIsolationLevel('serializable')
			.execute(function (transaction: Transaction<Database>): Promise<void> {
				let media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
				let category: Category | undefined;

				return transaction.selectFrom('movie')
				.select('user_id as userId')
				.where('id', '=', request['parameter']['movieId'])
				.where('is_deleted', '=', false)
				.executeTakeFirst()
				.then(function (movie?: Pick<Movie, 'userId'>): Promise<void> | void {
					if(typeof(movie) !== 'undefined') {
						if(request['user']['id'] === movie['userId']) {
							if(typeof(request['body']['categoryId']) === 'number') {
								if(request['body']['categoryId'] in CATEGORYS) {
									category = {
										id: request['body']['categoryId'],
										title: CATEGORYS[request['body']['categoryId']]
									};
								} else {
									throw new BadRequest('Body[\'categoryId\'] must be valid');
								}
							}

							if(typeof(request['body']['mediaId']) === 'number') {
								return transaction.selectFrom('media')
								.select(['media.id', 'media.hash', 'media.width', 'media.height'])
								.where('media.id', '=', request['body']['mediaId'])
								.where('media.is_deleted', '=', false)
								.leftJoin('media_video as video', 'media.id', 'video.media_id')
								.select('video.id as video_id')
								.executeTakeFirst()
								.then(function (rawMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id'>>): void {
									if(typeof(rawMedia) !== 'undefined') {
										if(rawMedia['video_id'] === null) {
											media = {
												id: rawMedia['id'],
												hash: rawMedia['hash'],
												width: rawMedia['width'],
												height: rawMedia['height']
											};

											return;
										} else {
											throw new BadRequest('Body[\'imageMediaId\'] must not be video');
										}
									} else {
										throw new BadRequest('Body[\'mediaId\'] must be valid');
									}
								});
							} else {
								return;
							}
						} else {
							throw new Unauthorized('User must be same');
						}
					} else {
						throw new NotFound('Parameter[\'movieId\'] must be valid');
					}
				})
				.then(function (): Promise<UpdateResult> {
					return transaction.updateTable('movie')
					.set({
						title: request['body']['title'],
						description: request['body']['description'],
						media_id: request['body']['mediaId'],
						category_id: request['body']['categoryId']
					})
					.where('id', '=', request['parameter']['movieId'])
					.executeTakeFirst();
				})
				.then(function (result: UpdateResult): void {
					if(result['numUpdatedRows'] === 1n) {
						response.send({
							id: request['parameter']['movieId'],
							title: request['body']['title'],
							description: request['body']['description'],
							imageMedia: media,
							category: category
						} satisfies Pick<Movie, 'id'> & Partial<Pick<Movie, 'title' | 'description'> & {
							imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
							category: Category;
						}>);
	
						if(typeof(request['body']['title']) === 'string' || typeof(request['body']['description']) === 'string') {
							redis.set('movieIndex:update:' + request['parameter']['movieId'], JSON.stringify({
								title: request['body']['title'],
								description: request['body']['description']
							}))
							.catch(request['server']['logger'].error);
						}

						return;
					} else {
						throw new NotFound('Parameter[\'movieId\'] must be valid');
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