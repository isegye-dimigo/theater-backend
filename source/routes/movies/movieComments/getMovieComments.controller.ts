import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Media, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieComment['movieId'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			movieComments: {
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
									hash: true,
									id: true,
									width: true,
									height: true
								}
							}
						}
					},
					time: true,
					content: true,
					createdAt: true
				},
				where: {
					movie: {
						id: request['params']['movieId'],
						isDeleted: false
					},
					isDeleted: false
				},
				skip: request['query']['page[size]'] * request['query']['page[index]'],
				take: request['query']['page[size]'],
				orderBy: {
					id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
				}
			}
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: {
		movieComments: (Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
				profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null;
			};
		})[];
	} | null): void {
		if(movie !== null) {
			reply.send(movie['movieComments']);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}