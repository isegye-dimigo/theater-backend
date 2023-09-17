import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Media, Movie, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['user'].findFirst({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			verificationKey: null,
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<(Omit<MovieComment, 'movieId' | 'userId' | 'isDeleted'> & {
		movie: Pick<Movie, 'id' | 'title'> & {
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
		};
	})[]> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
				return prisma['movieComment'].findMany({
					select: {
						id: true,
						movie: {
							select: {
								id: true,
								title: true,
								imageMedia: {
									select: {
										id: true,
										hash: true,
										width: true,
										height: true,
										isVideo: true
									}
								}
							}
						},
						time: true,
						content: true,
						createdAt: true
					},
					where: {
						user: {
							handle: request['params']['userHandle'],
							verificationKey: null,
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
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}