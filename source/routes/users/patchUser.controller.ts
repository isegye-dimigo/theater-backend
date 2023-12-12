import { kysely } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/error';
import { Database, Media, MediaVideo, Request, Response, User } from '@library/type';
import { getEncryptedPassword, resolveInSequence } from '@library/utility';
import { Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		userHandle: User['handle'];
	};
	body: Partial<Pick<User, 'email' | 'password' | 'handle' | 'name' | 'description' | 'profileMediaId' | 'bannerMediaId'>> & {
		currentPassword: string;
	};
}>, response: Response): Promise<void> {
	if(Object.keys(request['body'])['length'] !== 0) {
		return kysely.transaction()
		.setIsolationLevel('serializable')
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			let user: Pick<User, 'id' | 'password' | 'createdAt'>;
			let profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
			let bannerMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
	
			return transaction.selectFrom('user')
			.select(['id', 'password', 'created_at as createdAt'])
			.where('handle', '=', request['parameter']['userHandle'])
			.where('is_deleted', '=', false)
			.executeTakeFirst()
			.then(function (rawUser?: Pick<User, 'id' | 'password' | 'createdAt'>): Promise<string> {
				if(typeof(rawUser) !== 'undefined') {
					if(request['user']['id'] === rawUser['id']) {
						user = rawUser;
	
						return getEncryptedPassword(request['body']['currentPassword'], user['createdAt'].getTime().toString(10));
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'userHandle\'] must be valid');
				}
			})
			.then(function (encryptedCurrentPassword: string): Promise<void[]> {
				if(user['password'] === encryptedCurrentPassword) {
					const validationPromises: Promise<void>[] = [];
		
					if(typeof(request['body']['password']) === 'string') {
						validationPromises.push(getEncryptedPassword(request['body']['password'], user['createdAt'].getTime().toString(10))
						.then(function (encryptedPassword: string): void {
							request['body']['password'] = encryptedPassword;
		
							return;
						}));
					}
		
					if(typeof(request['body']['email']) === 'string') {
						validationPromises.push(transaction.selectFrom('user')
						.select('id')
						.where('email', '=', request['body']['email'])
						.executeTakeFirst()
						.then(function (user?: Pick<User, 'id'>): void {
							if(typeof(user) === 'undefined') {
								return;
							} else {
								throw new Conflict('Body[\'email\'] must be unique');
							}
						}));
					}
		
					if(typeof(request['body']['handle']) === 'string') {
						validationPromises.push(transaction.selectFrom('user')
						.select('id')
						.where('handle', '=', request['body']['handle'])
						.executeTakeFirst()
						.then(function (user?: Pick<User, 'id'>): void {
							if(typeof(user) === 'undefined') {
								return;
							} else {
								throw new Conflict('Body[\'handle\'] must be unique');
							}
						}));
					}
		
					if(typeof(request['body']['profileMediaId']) === 'number') {
						validationPromises.push(transaction.selectFrom('media')
						.select(['media.id', 'media.hash', 'media.width', 'media.height'])
						.where('media.id', '=', request['body']['profileMediaId'])
						.where('media.is_deleted', '=', false)
						.leftJoin('media_video as video', 'media.id', 'video.media_id')
						.select('video.id as video_id')
						.executeTakeFirst()
						.then(function (media?: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id'>>) {
							if(typeof(media) !== 'undefined') {
								if(media['video_id'] === null) {
									profileMedia = {
										id: media['id'],
										hash: media['hash'],
										width: media['width'],
										height: media['height']
									};
		
									return;
								} else {
									throw new BadRequest('Body[\'profileMediaId\'] must not be video');
								}
							} else {
								throw new BadRequest('Body[\'profileMediaId\'] must be valid');
							}
						}));
					}
		
					if(typeof(request['body']['bannerMediaId']) === 'number') {
						validationPromises.push(transaction.selectFrom('media')
						.select(['media.id', 'media.hash', 'media.width', 'media.height'])
						.where('media.id', '=', request['body']['bannerMediaId'])
						.where('media.is_deleted', '=', false)
						.leftJoin('media_video as video', 'media.id', 'video.media_id')
						.select('video.id as video_id')
						.executeTakeFirst()
						.then(function (media?: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id'>>) {
							if(typeof(media) !== 'undefined') {
								if(media['video_id'] === null) {
									bannerMedia = {
										id: media['id'],
										hash: media['hash'],
										width: media['width'],
										height: media['height']
									};
		
									return;
								} else {
									throw new BadRequest('Body[\'bannerMediaId\'] must not be video');
								}
							} else {
								throw new BadRequest('Body[\'bannerMediaId\'] must be valid');
							}
						}));
					}
		
					return resolveInSequence(validationPromises);
				} else {
					throw new Unauthorized('Body[\'currentPassword\'] must be valid');
				}
			})
			.then(function (): Promise<UpdateResult> {
				return transaction.updateTable('user')
				.set({
					email: request['body']['email'],
					password: request['body']['password'],
					handle: request['body']['handle'],
					name: request['body']['name'],
					description: request['body']['description'],
					profile_media_id: request['body']['profileMediaId'],
					banner_media_id: request['body']['bannerMediaId']
				})
				.where('id', '=', request['user']['id'])
				.executeTakeFirstOrThrow();
			})
			.then(function (result: UpdateResult) {
				if(result['numUpdatedRows'] === 1n) {
					response.send({
						id: request['user']['id'],
						email: request['body']['email'],
						password: typeof(request['body']['password']) === 'string' ? 'superUnsuspiciousRealPassword' : undefined,
						handle: request['body']['handle'],
						name: request['body']['name'],
						description: request['body']['description'],
						profileMedia: profileMedia,
						bannerMedia: bannerMedia
					} satisfies Pick<User, 'id'> & Partial<Pick<User, 'email' | 'password' | 'handle' | 'name' | 'description'> & {
						profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
						bannerMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
					}>);
	
					return;
				} else {
					throw new NotFound('Parameter[\'userHandle\'] must be valid');
				}
			});
		});
	} else {
		throw new BadRequest('Body must have more than one key');
	}
}