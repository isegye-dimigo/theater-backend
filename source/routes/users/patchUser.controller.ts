import { prisma } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/httpError';
import { getEncryptedPassword } from '@library/utility';
import { Media, MediaVideo, User } from '@prisma/client';
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
		let user: Pick<User, 'email' | 'password'>;

		prisma['user'].findUnique({
			select: {
				id: true,
				email: true,
				password: true
			},
			where: {
				handle: request['params']['userHandle'],
				isDeleted: false
			}
		})
		.then(function (_user: Pick<User, 'id' | 'email' | 'password'> | null): Promise<string> {
			if(_user !== null) {
				if(request['user']['id'] === _user['id']) {
					user = {
						email: _user['email'],
						password: _user['password']
					};

					return getEncryptedPassword(request['body']['currentPassword'], _user['email']);
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(function (encryptedCurrentPassword: string): Promise<void[]> {
			if(encryptedCurrentPassword === user['password']) {
				const validationPromises: Promise<void>[] = [];
				const isNewPassword: boolean = typeof(request['body']['password']) === 'string';

				if(typeof(request['body']['email']) === 'string' && !isNewPassword) {
					validationPromises.push(getEncryptedPassword(request['body']['currentPassword'], user['email'])
					.then(function (encryptedPassword: string): void {
						request['body']['password'] = encryptedPassword;

						return;
					}));
				}

				if(isNewPassword) {
					validationPromises.push(getEncryptedPassword(request['body']['password'] as string, user['email'])
					.then(function (encryptedPassword: string): void {
						request['body']['password'] = encryptedPassword;

						return;
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
					validationPromises.push(prisma['mediaVideo'].findUnique({
						select: {
							id: true
						},
						where: {
							id: request['body']['profileMediaId']
						}
					})
					.then(function (mediaVideo: Pick<MediaVideo, 'id'> | null): void {
						if(mediaVideo !== null) {
							return;
						} else {
							throw new BadRequest('Body[\'profileMediaId\'] must be valid');
						}
					}));
				}

				if(typeof(request['body']['bannerMediaId']) === 'number') {
					validationPromises.push(prisma['mediaVideo'].findUnique({
						select: {
							id: true
						},
						where: {
							id: request['body']['bannerMediaId']
						}
					})
					.then(function (mediaVideo: Pick<MediaVideo, 'id'> | null): void {
						if(mediaVideo !== null) {
							return;
						} else {
							throw new BadRequest('Body[\'bannerMediaId\'] must be valid');
						}
					}));
				}

				return Promise.all(validationPromises);
			} else {
				throw new Unauthorized('Body[\'currentPassword\'] must be valid');
			}
		})
		.then(function (): Promise<Pick<User, 'id' | 'handle' | 'name' | 'description' | 'isVerified' | 'createdAt'> & Record<'profileMedia' | 'bannerMedia', Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null>> {
			return prisma['user'].update({
				select: {
					id: true,
					handle: true,
					name: true,
					description: true,
					isVerified: true,
					profileMedia: {
						select: {
							id: true,
							hash: true,
							width: true,
							height: true
						}
					},
					bannerMedia: {
						select: {
							id: true,
							hash: true,
							width: true,
							height: true
						}
					},
					createdAt: true
				},
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
		.then(reply.send.bind(reply))
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body must have more than one key'));
	}

	return;
}