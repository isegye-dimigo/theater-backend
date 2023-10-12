import { prisma, redis } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Movie, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			userId: true
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: Pick<Movie, 'userId'> | null): Promise<Prisma.BatchPayload[]> {
		if(movie !== null) {
			if(request['user']['id'] === movie['userId']) {
				return prisma.$transaction([prisma['movie'].updateMany({
					data: {
						isDeleted: true
					},
					where: {
						id: request['params']['movieId'],
						isDeleted: false
					}
				}), prisma['movieStatistic'].deleteMany({
					where: {
						movieId: request['params']['movieId']
					}
				}), prisma['media'].updateMany({
					data: {
						isDeleted: true
					},
					where: {
						videoMovie: {
							id: request['params']['movieId']
						}
					}
				})]);
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (results: Prisma.BatchPayload[]): void {
		if(results[0]['count'] === 1) {
			reply.status(204).send();

			redis.set('movieIndex:delete:' + request['params']['movieId'], 'null')
			.catch(request['log'].error);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}