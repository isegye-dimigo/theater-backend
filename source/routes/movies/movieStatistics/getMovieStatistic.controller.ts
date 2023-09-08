import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Movie, MovieStatistic } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
		movieStatisticId: MovieStatistic['id'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	
	prisma['movie'].count({
		where: {
			OR: [{
				id: request['params']['movieId'],
				isDeleted: false
			}, {
				id: request['params']['movieId'],
				isDeleted: false,
				movieStatistics: {
					some: {
						id: request['params']['movieStatisticId']
					}
				}
			}]
		}
	})
	.then(function (movieCount: number): Promise<Omit<MovieStatistic, 'movieId'> | null> {
		switch(movieCount) {
			default: {
				return prisma['movieStatistic'].findUnique({
					select: {
						id: true,
						viewCount: true,
						commentCount: true,
						likeCount: true,
						starAverage: true,
						createdAt: true
					},
					where: {
						id: request['params']['movieStatisticId']
					}
				});
			}
			case 1: {
				throw new NotFound('Parameter[\'movieStatisticId\'] must be valid');
			}
			case 0: {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));
	
	return;
}