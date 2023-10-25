import { prisma } from '@library/database';
import { Conflict, NotFound } from '@library/httpError';
import { MovieLike } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieLike['movieId'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			movieLikes: {
				select: {
					id: true
				},
				where: {
					movieId: request['params']['movieId'],
					userId: request['user']['id']
				}
			}
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: {
		movieLikes: Pick<MovieLike, 'id'>[];
	} | null): Promise<Pick<MovieLike, 'id' | 'createdAt'>> {
		if(movie !== null) {
			if(movie['movieLikes']['length'] === 0) {
				return prisma['movieLike'].create({
					select: {
						id: true,
						createdAt: true
					},
					data: {
						movieId: request['params']['movieId'],
						userId: request['user']['id']
					}
				});
			} else {
				throw new Conflict('User must not liked');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}