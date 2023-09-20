import { prisma } from '@library/database';
import { Conflict, NotFound } from '@library/httpError';
import { Movie, MovieStar, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Pick<MovieStar, 'value'>;
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
			if(movie['movieStars']['length'] === 0) {
				return prisma['movieStar'].createMany({
					data: {
						movieId: request['params']['movieId'],
						userId: request['user']['id'],
						value: request['body']['value']
					}
				});
			} else {
				throw new Conflict('User must not starred');
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