import { prisma } from '@library/database';
import { BadRequest, Conflict, NotFound, Unauthorized } from '@library/httpError';
import { Movie, Series, SeriesMovie } from '@prisma/client';
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
			userId: true
		},
		where: {
			id: request['params']['seriesId']
		}
	}), prisma['movie'].findUnique({
		select: {
			userId: true,
			seriesMovie: {
				select: {
					id: true
				}
			}
		},
		where: {
			id: request['body']['movieId'],
			isDeleted: false
		}
	})])
	.then(function (results: [Pick<Series, 'userId'> | null, Pick<Movie, 'userId'> & {
		seriesMovie: Pick<SeriesMovie, 'id'> | null;
	} | null]): Promise<number> {
		if(results[0] !== null) {
			if(results[0]['userId'] === request['user']['id']) {
				if(results[1] !== null) {
					if(results[1]['userId'] === request['user']['id']) {
						if(results[1]['seriesMovie'] === null) {
							return prisma.$executeRaw`INSERT INTO series_movie (series_id, movie_id, \`index\`, subtitle) SELECT ${request['params']['seriesId']}, ${request['body']['movieId']}, COALESCE(MAX(\`index\`) + 1, 0), ${request['body']['subtitle']} FROM series_movie WHERE series_id = ${request['params']['seriesId']}`;
						} else {
							throw new Conflict('Body[\'movieId\'] must be unique');
						}
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new BadRequest('Body[\'movieId\'] must be valid');
				}
			} else {
				throw new Unauthorized('User must be same');
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