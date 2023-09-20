import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Media, MediaVideoMetadata, Movie, MovieStatistic, User, UserHistory } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<(Pick<UserHistory, 'id' | 'createdAt'> & {
		movie: Pick<Movie, 'id' | 'title'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			videoMedia: {
				mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration'> | null;
			};
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
			movieStatistics: Pick<MovieStatistic, 'viewCount'>[];
		};
	})[]> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
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
										isVerified: true
									}
								},
								title: true,
								videoMedia: {
									select: {
										mediaVideoMetadata: {
											select: {
												duration: true
											}
										}
									}
								},
								imageMedia: {
									select: {
										id: true,
										hash: true,
										width: true,
										height: true,
										isVideo: true
									}
								},
								movieStatistics: {
									select: {
										viewCount: true
									},
									take: 1,
									orderBy: {
										id: 'desc'
									}
								}
							}
						},
						createdAt: true
					},
					where: {
						user: {
							handle: request['params']['userHandle'],
							isDeleted: false
						},
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