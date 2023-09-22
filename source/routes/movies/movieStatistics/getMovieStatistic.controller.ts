import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
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
			userId: true,
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
	.then(function (movie: Pick<Movie, 'userId'> & {
		movieStatistics: Omit<MovieStatistic, 'movieId'>[];
	} | null): void {
		if(movie !== null) {
			if(movie['movieStatistics']['length'] === 1) {
				if(request['user']['id'] === movie['userId']) {
					reply.send(movie['movieStatistics'][0]);
	
					return;
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'movieStatisticId\'] must be valid');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}