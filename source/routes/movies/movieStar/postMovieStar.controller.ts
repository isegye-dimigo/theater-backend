import { prisma } from '@library/database';
import { Conflict, NotFound } from '@library/httpError';
import { MovieStar } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieStar['movieId'];
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
	} | null): Promise<Pick<MovieStar, 'id' | 'value' | 'createdAt'>> {
		if(movie !== null) {
			if(movie['movieStars']['length'] === 0) {
				return prisma['movieStar'].create({
					select: {
						id: true,
						value: true,
						createdAt: true
					},
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
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}