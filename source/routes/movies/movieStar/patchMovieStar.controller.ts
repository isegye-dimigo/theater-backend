import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
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
					some: {
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
				return prisma['movieStar'].updateMany({
					data: {
						value: request['body']['value']
					},
					where: {
						id: request['params']['movieId'],
						userId: request['user']['id']
					}
				});
			}
			case 1: {
				throw new NotFound('User must starred first');
			}
			case 0: {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}