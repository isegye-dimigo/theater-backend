import { prisma } from '@library/database';
import { BadRequest, Conflict, NotFound } from '@library/httpError';
import { Series, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: SeriesMovie['seriesId'];
	};
	Body: {
		movieId: SeriesMovie['id'];
		subtitle: SeriesMovie['subtitle'];
	}
}>, reply: FastifyReply): void {
	Promise.all([prisma['series'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['seriesId']
		}
	}), prisma['movie'].findUnique({
		select: {
			seriesMovie: {
				select: {
					id: true
				},
				where: {
					seriesId: request['params']['seriesId']
				}
			}
		},
		where: {
			id: request['body']['movieId'],
			isDeleted: false
		}
	})])
	.then(function (results: [Pick<Series, 'id'> | null, {
		seriesMovie: Pick<SeriesMovie, 'id'> | null;
	} | null]): Promise<number> {
		if(results[0] !== null) {
			if(results[1] !== null) {
				if(results[1]['seriesMovie'] === null) {
					return prisma.$executeRaw`
					INSERT INTO series_movie
					(series_id, movie_id, \`index\`, subtitle)
					SELECT 
					${request['params']['seriesId']}, ${request['body']['movieId']}, MAX(\`index\`) + 1, ${request['body']['subtitle']} 
					FROM series_movie 
					WHERE series_id = ${request['params']['seriesId']}
					`;
				} else {
					throw new Conflict('Body[\'movieId\'] must be unique');
				}
			} else {
				throw new BadRequest('Body[\'movieId\'] must be valid');
			}
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (resultCount: number): void {
		if(resultCount === 1) {
			reply.status(201).send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}