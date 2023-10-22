import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { MovieLike, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieLike['movieId'];
	}
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
			if(movie['movieLikes']['length'] === 1) {
				return prisma['movieLike'].deleteMany({
					where: {
						id: request['params']['movieId'],
						userId: request['user']['id']
					}
				});
			} else {
				throw new NotFound('User must liked');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}