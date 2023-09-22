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
	prisma['movie'].findUnique({
		select: {
			movieStatistics: {
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
			}
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: {
		movieStatistics: Omit<MovieStatistic, 'movieId'>[];
	} | null): void {
		if(movie !== null) {
			if(movie['movieStatistics']['length'] === 1) {
				reply.send(movie['movieStatistics'][0]);

				return;
			} else {
				throw new NotFound('Parameter[\'movieStatisticId\'] must be valid');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}