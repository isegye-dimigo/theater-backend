import { prisma } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/httpError';
import { getEncryptedPassword, resolveInSequence } from '@library/utility';
import { Media, MediaVideo, Prisma, PrismaClient, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Body: Partial<Pick<User, 'email' | 'password' | 'handle' | 'name' | 'description' | 'profileMediaId' | 'bannerMediaId'>> & {
		currentPassword: string;
	};
}>, reply: FastifyReply): void {
	if(Object.keys(request['body'])['length'] !== 0) {
		let user: Pick<User, 'id' | 'password' | 'createdAt'>;
		let profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
		let bannerMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;

		prisma['user'].findUnique({
			select: {
				id: true,
				password: true,
				createdAt: true
			},
			where: {
				handle: request['params']['userHandle'],
				isDeleted: false
			}
		})
		.then(function (_user: Pick<User, 'id' | 'password' | 'createdAt'> | null): Promise<string> {
			if(_user !== null) {
				if(request['user']['id'] === _user['id']) {
					user = _user;

					return getEncryptedPassword(request['body']['currentPassword'], user['createdAt'].getTime().toString(10));
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(function (encryptedCurrentPassword: string): Promise<void> {
			if(encryptedCurrentPassword === user['password']) {
				return prisma.$transaction(function (prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">): Promise<void> {
					const validationPromises: Promise<void>[] = [];

					if(typeof(request['body']['password']) === 'string') {
						validationPromises.push(getEncryptedPassword(request['body']['password'], user['createdAt'].getTime().toString(10))
						.then(function (encryptedPassword: string): void {
							request['body']['password'] = encryptedPassword;

							return;
						}));
					}

					if(typeof(request['body']['email']) === 'string') {
						validationPromises.push(prisma['user'].findUnique({
							select: {
								id: true
							},
							where: {
								email: request['body']['email']
							}
						})
						.then(function (user: Pick<User, 'id'> | null): void {
							if(user !== null) {
								return;
							} else {
								throw new Conflict('Body[\'email\'] must be unique');
							}
						}));
					}

					if(typeof(request['body']['handle']) === 'string') {
						validationPromises.push(prisma['user'].findUnique({
							select: {
								id: true
							},
							where: {
								handle: request['body']['handle']
							}
						})
						.then(function (user: Pick<User, 'id'> | null): void {
							if(user !== null) {
								return;
							} else {
								throw new Conflict('Body[\'handle\'] must be unique');
							}
						}));
					}

					if(typeof(request['body']['profileMediaId']) === 'number') {
						validationPromises.push(prisma['media'].findUnique({
							select: {
								id: true,
								hash: true,
								width: true,
								height: true,
								mediaVideo: {
									select: {
										id: true
									}
								}
							},
							where: {
								id: request['body']['profileMediaId'],
								isDeleted: false
							}
						})
						.then(function (media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
							mediaVideo: Pick<MediaVideo, 'id'> | null;
						} | null): void {
							if(media !== null) {
								if(media['mediaVideo'] === null) {
									profileMedia = {
										id: media['id'],
										hash: media['hash'],
										width: media['width'],
										height: media['height'],
									};
									
									return;
								} else {
									throw new BadRequest('Body[\'profileMediaId\'] must be video');
								}
							} else {
								throw new BadRequest('Body[\'profileMediaId\'] must be valid');
							}
						}));
					}

					if(typeof(request['body']['bannerMediaId']) === 'number') {
						validationPromises.push(prisma['media'].findUnique({
							select: {
								id: true,
								hash: true,
								width: true,
								height: true,
								mediaVideo: {
									select: {
										id: true
									}
								}
							},
							where: {
								id: request['body']['bannerMediaId'],
								isDeleted: false
							}
						})
						.then(function (media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
							mediaVideo: Pick<MediaVideo, 'id'> | null;
						} | null): void {
							if(media !== null) {
								if(media['mediaVideo'] === null) {
									bannerMedia = {
										id: media['id'],
										hash: media['hash'],
										width: media['width'],
										height: media['height'],
									};
									
									return;
								} else {
									throw new BadRequest('Body[\'bannerMediaId\'] must be video');
								}
							} else {
								throw new BadRequest('Body[\'bannerMediaId\'] must be valid');
							}
						}));
					}

					return resolveInSequence(validationPromises);
				});
			} else {
				throw new Unauthorized('Body[\'currentPassword\'] must be valid');
			}
		})
		.then(function (): Promise<Prisma.BatchPayload> {
			return prisma['user'].updateMany({
				data: {
					email: request['body']['email'],
					password: request['body']['password'],
					handle: request['body']['handle'],
					name: request['body']['name'],
					description: request['body']['description'],
					profileMediaId: request['body']['profileMediaId'],
					bannerMediaId: request['body']['bannerMediaId']
				},
				where: {
					handle: request['params']['userHandle'],
					isDeleted: false
				}
			});
		})
		.then(function (result: Prisma.BatchPayload): void {
			if(result['count'] === 1) {
				// Pick<User, 'email' | 'password' | 'handle' | 'name' | 'description' | 'profileMediaId' | 'bannerMediaId'>>
				
				reply.send({
					id: user['id'],
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
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body must have more than one key'));
	}

	return;
}