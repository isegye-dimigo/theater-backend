import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Movie, MovieStar, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			movieStars: {
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
		movieStars: Pick<MovieStar, 'id'>[];
	} | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			if(movie['movieStars']['length'] === 1) {
				return prisma['movieStar'].deleteMany({
					where: {
						id: request['params']['movieId'],
						userId: request['user']['id']
					}
				});
			} else {
				throw new NotFound('User must starred');
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