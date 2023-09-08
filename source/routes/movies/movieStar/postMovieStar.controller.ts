import { prisma } from '@library/database';
import { Conflict, InternalServerHttpError, NotFound } from '@library/httpError';
import { Movie, MovieStar, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Pick<MovieStar, 'value'>;
}>, reply: FastifyReply): void {
	prisma['movie'].count({
		where: {
			OR: [{
				id: request['params']['movieId'],
				isDeleted: false
			}, {
				id: request['params']['movieId'],
				isDeleted: false,
				movieStars: {
					none: {
						movieId: request['params']['movieId'],
						userId: request['user']['id']
					}
				}
			}]
		}
	})
	.then(function (movieCount: number): Promise<Prisma.BatchPayload> {
		switch(movieCount) {
			default: {
				return prisma['movieStar'].createMany({
					data: {
						movieId: request['params']['movieId'],
						userId: request['user']['id'],
						value: request['body']['value']
					}
				});
			}
			case 1: {
				throw new Conflict('User must not starred');
			}
			case 0: {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 0) {
			reply.status(201).send(null);
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}