import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Media, Movie, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['movie'].count({
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movieCount: number): Promise<(Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
			profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null;
		};
	})[]> {
		if(movieCount === 1) {
			return prisma['movieComment'].findMany({
				select: {
					id: true,
					user: {
						select: {
							id: true,
							handle: true,
							name: true,
							profileMedia: {
								select: {
									hash: true,
									id: true,
									width: true,
									height: true
								}
							},
							isVerified: true
						}
					},
					time: true,
					content: true,
					createdAt: true
				},
				where: {
					movieId: request['params']['movieId'],
					isDeleted: false
				},
				skip: request['query']['page[size]'] * request['query']['page[index]'],
				take: request['query']['page[size]'],
				orderBy: {
					id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
				}
			});
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}