import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Movie, MovieLike, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
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
	} | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			if(movie['movieLikes']['length'] === 0) {
				return prisma['movieLike'].createMany({
					data: {
						movieId: request['params']['movieId'],
						userId: request['user']['id']
					}
				});
			} else {
				throw new NotFound('User must not liked');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 0) {
			reply.status(201).send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}