import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Series, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: SeriesMovie['seriesId'];
		movieId: SeriesMovie['movieId'];
	};
}>, reply: FastifyReply): void {
	Promise.all([prisma['series'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['seriesId']
		}
	}), prisma['seriesMovie'].findUnique({
		select: {
			index: true
		},
		where: {
			seriesId: request['params']['seriesId'],
			movieId: request['params']['movieId']
		}
	})])
	.then(function (results: [Pick<Series, 'id'> | null, Pick<SeriesMovie, 'index'> | null]): Promise<[number, number]> {
		if(results[0] !== null) {
			if(results[1] !== null) {
				return prisma.$transaction([prisma.$executeRawUnsafe(`
					DELETE FROM series_movie
					WHERE series_id = ` + request['params']['seriesId'] + ` AND movie_id = ` + request['params']['movieId']
				), prisma.$executeRawUnsafe(`
					UPDATE series_movie 
					SET \`index\` = \`index\` - 1 
					WHERE series_id = ` + request['params']['seriesId'] + ` AND \'index\' > ` + results[1]['index'])]);
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (resultCounts: [number, number]): void {
		if(resultCounts[0] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}