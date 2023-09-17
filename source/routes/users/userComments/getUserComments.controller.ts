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
	if(request['user']['handle'] === request['params']['userHandle']) {
		prisma['user'].count({
			where: {
				handle: request['params']['userHandle'],
				verificationKey: null,
				isDeleted: false
			}
		})
		.then(function (userCount: number): Promise<(Omit<MovieComment, 'movieId' | 'userId' | 'isDeleted'> & {
			movie: Pick<Movie, 'id' | 'title'> & {
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
			};
		})[]> {
			if(userCount === 1) {
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