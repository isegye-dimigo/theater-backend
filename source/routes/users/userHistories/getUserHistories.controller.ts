import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Media, Movie, User, UserHistory } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	if(request['user']['handle'] === request['params']['userHandle']) {
		prisma['user'].count({
			where: {
				handle: request['params']['userHandle'],
				verificationKey: null,
				isDeleted: false
			}
		})
		.then(function (userCount: number): Promise<(Pick<UserHistory, 'id' | 'createdAt'> & {
			movie: Pick<Movie, 'id' | 'title' | 'createdAt'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
					profileMedia: Pick<Media, 'id' | 'hash' | 'type' | 'width' | 'height'> | null;
				};
				imageMedia: Pick<Media, 'id' | 'hash' | 'type' | 'width' | 'height'>;
			};
		})[]> {
			if(userCount === 1) {
				return prisma['userHistory'].findMany({
					select: {
						id: true,
						movie: {
							select: {
								id: true,
								user: {
									select: {
										id: true,
										handle: true,
										name: true,
										isVerified: true,
										profileMedia: {
											select: {
												id: true,
												hash: true,
												type: true,
												width: true,
												height: true
											}
										}
									}
								},
								title: true,
								imageMedia: {
									select: {
										id: true,
										hash: true,
										type: true,
										width: true,
										height: true
									}
								},
								createdAt: true
							}
						},
						createdAt: true
					},
					where: {
						user: {
							handle: request['params']['userHandle'],
							isDeleted: false
						},
						isDeleted: false,
						movie: {
							isDeleted: false
						}
					},
					skip: request['query']['page[size]'] * request['query']['page[index]'],
					take: request['query']['page[size]'],
					orderBy: {
						id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
					}
				});
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
		.then(reply.send.bind(reply))
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new Unauthorized('User must be same'));
	}

	return;
}