import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Movie, MovieStatistic } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
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
					movieId: request['params']['movieId']
				},
				skip: request['query']['page[size]'] * request['query']['page[index]'],
				take: request['query']['page[size]'],
				orderBy: {
					id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
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
			reply.send(movie['movieStatistics']);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}