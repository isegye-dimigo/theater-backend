import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Prisma, Series, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: SeriesMovie['seriesId'];
		seriesMovieId: SeriesMovie['id'];
	};
}>, reply: FastifyReply): void {
	Promise.all([prisma['series'].findUnique({
		select: {
			userId: true
		},
		where: {
			id: request['params']['seriesId']
		}
	}), prisma['seriesMovie'].findUnique({
		select: {
			index: true
		},
		where: {
			id: request['params']['seriesMovieId']
		}
	})])
	.then(function (results: [Pick<Series, 'userId'> | null, Pick<SeriesMovie, 'index'> | null]): Promise<[Prisma.BatchPayload, number]> {
		if(results[0] !== null) {
			if(results[0]['userId'] === request['user']['id']) {
				if(results[1] !== null) {
					return prisma.$transaction([prisma['seriesMovie'].deleteMany({
						where: {
							id: request['params']['seriesMovieId']
						}
					}), prisma.$executeRaw`UPDATE series_movie SET \`index\` = \`index\` - 1 WHERE series_id = ${request['params']['seriesId']} AND \`index\` > ${results[1]['index']} ORDER BY \`index\` ASC`]);
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (resultCounts: [Prisma.BatchPayload, number]): void {
		if(resultCounts[0]['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}