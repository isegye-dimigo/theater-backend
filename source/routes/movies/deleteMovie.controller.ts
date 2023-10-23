import { prisma, redis } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Movie, Prisma, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			userId: true,
			seriesMovie: {
				select: {
					seriesId: true,
					index: true
				}
			}
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: Pick<Movie, 'userId'> & {
		seriesMovie: Pick<SeriesMovie, 'seriesId' | 'index'> | null;
	} | null) {
		if(movie !== null) {
			if(request['user']['id'] === movie['userId']) {
				const deletionPromises: Prisma.PrismaPromise<Prisma.BatchPayload | number>[] = [prisma['movie'].updateMany({
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
				}), prisma.$executeRaw`UPDATE media, movie SET media.is_deleted = 1 WHERE media.id = movie.video_media_id AND movie.id = ${request['params']['movieId']}`];

				if(movie['seriesMovie'] !== null) {
					deletionPromises.push(prisma['seriesMovie'].deleteMany({
						where: {
							movieId: request['params']['movieId']
						}
					}), prisma.$executeRaw`UPDATE series_movie SET \`index\` = \`index\` - 1 WHERE series_id = ${movie['seriesMovie']['seriesId']} AND \`index\` > ${movie['seriesMovie']['index']} ORDER BY \`index\` ASC`)
				}

				return prisma.$transaction(deletionPromises);
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (results: (Prisma.BatchPayload | number)[]): void {
		if((results[0] as Prisma.BatchPayload)['count'] === 1) {
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