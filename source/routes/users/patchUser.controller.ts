import { prisma } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/httpError';
import { getEncryptedPassword } from '@library/utility';
import { Media, User } from '@prisma/client';
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
				const validations: Promise<void>[] = [];
				const isNewPassword: boolean = typeof(request['body']['password']) === 'string';

				if(typeof(request['body']['email']) === 'string' && !isNewPassword) {
					validations.push(getEncryptedPassword(request['body']['currentPassword'], user['email'])
					.then(function (encryptedPassword: string): void {
						request['body']['password'] = encryptedPassword;

						return;
					}));
				}

				if(isNewPassword) {
					validations.push(getEncryptedPassword(request['body']['password'] as string, user['email'])
					.then(function (encryptedPassword: string): void {
						request['body']['password'] = encryptedPassword;

						return;
					}));
				}

				if(typeof(request['body']['handle']) === 'string') {
					validations.push(prisma['user'].count({
						where: {
							handle: request['body']['handle']
						}
					})
					.then(function (userCount: number): void {
						if(userCount === 0) {
							return;
						} else {
							throw new Conflict('Body[\'handle\'] must be unique');
						}
					}));
				}

				if(typeof(request['body']['profileMediaId']) === 'number') {
					validations.push(prisma['media'].count({
						where: {
							id: request['body']['profileMediaId'],
							isVideo: false,
							isDeleted: false
						}
					})
					.then(function (mediaCount: number): void {
						if(mediaCount === 1) {
							return;
						} else {
							throw new BadRequest('Body[\'profileMediaId\'] must be valid');
						}
					}));
				}

				if(typeof(request['body']['bannerMediaId']) === 'number') {
					validations.push(prisma['media'].count({
						where: {
							id: request['body']['bannerMediaId'],
							isVideo: false,
							isDeleted: false
						}
					})
					.then(function (mediaCount: number): void {
						if(mediaCount === 1) {
							return;
						} else {
							throw new BadRequest('Body[\'bannerMediaId\'] must be valid');
						}
					}));
				}

				return Promise.all(validations);
			} else {
				throw new Unauthorized('Body[\'currentPassword\'] must be valid');
			}
		})
		.then(function (): Promise<Pick<User, 'id' | 'handle' | 'name' | 'description' | 'isVerified' | 'createdAt'> & Record<'profileMedia' | 'bannerMedia', Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> | null>> {
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
							height: true,
							isVideo: true
						}
					},
					bannerMedia: {
						select: {
							id: true,
							hash: true,
							width: true,
							height: true,
							isVideo: true
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