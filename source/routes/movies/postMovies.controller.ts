import { CATEGORYS } from '@library/constant';
import { kysely, redis } from '@library/database';
import { BadRequest, Unauthorized } from '@library/error';
import { Category, Database, Media, MediaVideo, Movie, Request, Response, User } from '@library/type';
import { InsertResult, Transaction } from 'kysely';

export default function (request: Request<{
	body: Pick<Movie, 'title' | 'description' | 'mediaId' | 'categoryId'>;
}>, response: Response): Promise<void> {
	if(request['user']['isVerified']) {
		if(request['body']['categoryId'] in CATEGORYS) {
			return kysely.transaction()
			.setIsolationLevel('serializable')
			.execute(function (transaction: Transaction<Database>): Promise<void> {
				let media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				let movie: Pick<Movie, 'id' | 'createdAt'>;
				
				return transaction.selectFrom('media')
				.select(['media.id', 'media.hash', 'media.width', 'media.height'])
				.where('media.id', '=', request['body']['mediaId'])
				.where('media.is_deleted', '=', false)
				.leftJoin('media_video as video', 'media.id', 'video.media_id')
				.select('video.id as video_id')
				.executeTakeFirst()
				.then(function (rawMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id'>>): Promise<Pick<Movie, 'id' | 'createdAt'>> {
					if(typeof(rawMedia) !== 'undefined') {
						if(rawMedia['video_id'] === null) {
							media = {
								id: rawMedia['id'],
								hash: rawMedia['hash'],
								width: rawMedia['width'],
								height: rawMedia['height'],
							};

							return transaction.insertInto('movie')
							.values({
								user_id: request['user']['id'],
								title: request['body']['title'],
								description: request['body']['description'],
								media_id: request['body']['mediaId'],
								category_id: request['body']['categoryId']
							})
							.returning(['id', 'created_at as createdAt'])
							.executeTakeFirstOrThrow();
						} else {
							throw new BadRequest('Body[\'mediaId\'] must not be video');
						}
					} else {
						throw new BadRequest('Body[\'mediaId\'] must be valid');
					}
				})
				.then(function (rawMovie: Pick<Movie, 'id' | 'createdAt'>): Promise<InsertResult> {
					movie = rawMovie;

					return transaction.insertInto('movie_statistic')
					.values({
						movie_id: rawMovie['id']
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
						throw new BadRequest('Movie[\'id\'] must be valid');
					}
				})
				.then(function (user: Pick<User, 'handle' | 'name'>): void {
					response.setStatus(201);
					response.send({
						id: movie['id'],
						title: request['body']['title'],
						description: request['body']['description'],
						createdAt: movie['createdAt'],
						user: {
							id: request['user']['id'],
							handle: user['handle'],
							name: user['name'],
							isVerified: request['user']['isVerified']
						},
						media: media,
						category: {
							id: request['body']['categoryId'],
							title: CATEGORYS[request['body']['categoryId']]
						}
					} satisfies Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
						user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
						media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
						category: Category;
					});

					redis.set('movieIndex:create:' + movie['id'], JSON.stringify({
						title: request['body']['title'],
						description: request['body']['description']
					}))
					.catch(request['server']['logger'].error);

					return;
				});
			});
		} else {
			throw new BadRequest('Body[\'categoryId\'] must be valid');
		}
	} else {
		throw new Unauthorized('User must be verified');
	}
}