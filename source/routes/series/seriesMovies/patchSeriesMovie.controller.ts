import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Prisma, Series, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: SeriesMovie['seriesId'];
		seriesMovieId: SeriesMovie['id'];
	};
	Body: Partial<Pick<SeriesMovie, 'index' | 'subtitle'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			const isIndexDefined: boolean = typeof(request['body']['index']) === 'number';
			const selectionPromises: [Prisma.PrismaPromise<Pick<Series, 'userId'> | null>, Prisma.PrismaPromise<Pick<SeriesMovie, 'movieId'> & Partial<Pick<SeriesMovie, 'index' | 'subtitle'>> | null>, ...Prisma.PrismaPromise<Pick<SeriesMovie, 'index'>[]>[]] = [prisma['series'].findUnique({
				select: {
					userId: true
				},
				where: {
					id: request['params']['seriesId']
				}
			}), prisma['seriesMovie'].findUnique({
				select: Object.assign({
					movieId: true
				}, isIndexDefined ? {
					index: true,
					subtitle: true
				} : undefined),
				where: {
					id: request['params']['seriesMovieId']
				}
			})];

			if(isIndexDefined) {
				selectionPromises.push(prisma.$queryRaw<Pick<SeriesMovie, 'index'>[]>`SELECT MAX(\`index\`) AS \`index\` FROM series_movie WHERE series_id = ${request['params']['seriesId']}`);
			}
	
			prisma.$transaction(selectionPromises)
			.then(function (results: [Pick<Series, 'userId'> | null, Pick<SeriesMovie, 'movieId'> & Partial<Pick<SeriesMovie, 'index' | 'subtitle'>> | null, ...(Pick<SeriesMovie, 'index'>[])[]]): Promise<(number | Prisma.BatchPayload)[]> {
				if(results[0] !== null) {
					if(results[0]['userId'] === request['user']['id']) {
						if(results[1] !== null) {
							const updatePromises: Prisma.PrismaPromise<number | Prisma.BatchPayload>[] = [];
		
							if(isIndexDefined) {
								if(results[2]['length'] === 1) {
									if(0 <= (request['body']['index'] as number) && (request['body']['index'] as number) <= (results[2] as NonNullable<typeof results[2]>)[0]['index']) {
										const isIndexBigger: boolean = (results[1]['index'] as number) > (request['body']['index'] as number);
	
										if(results[1]['index'] !== (request['body']['index'] as number)) {
											updatePromises.push(prisma['seriesMovie'].deleteMany({
												where: {
													id: request['params']['seriesMovieId']
												}
											}), prisma.$executeRawUnsafe('UPDATE series_movie SET `index` = `index` ' + (isIndexBigger ? '+' : '-') + ' 1 WHERE series_id = ' + request['params']['seriesId'] + ' AND `index` ' + (isIndexBigger ? '>' : '<') + '= ' + request['body']['index'] + ' AND `index` ' + (isIndexBigger ? '<' : '>') + ' ' + results[1]['index'] + ' ORDER BY `index` ' + (isIndexBigger ? 'DESC' : 'ASC')), prisma.$executeRaw`INSERT INTO series_movie (id, series_id, movie_id, \`index\`, subtitle) VALUES (${request['params']['seriesMovieId']}, ${request['params']['seriesId']}, ${results[1]['movieId']}, ${request['body']['index']}, ${results[1]['subtitle'] as string})`);
										}
									} else {
										throw new BadRequest('Body[\'index\'] must be valid');
									}
								} else {
									throw new NotFound('Parameter[\'seriesId\'] must be valid');
								}
							}
							
							if(typeof(request['body']['subtitle']) === 'string') {
								updatePromises.push(prisma['seriesMovie'].updateMany({
									data: {
										subtitle: request['body']['subtitle']
									},
									where: {
										id: request['params']['seriesMovieId']
									}
								}));
							}
		
							return prisma.$transaction(updatePromises);
						} else {
							throw new NotFound('Parameter[\'seriesMovieId\'] must be valid');
						}
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'seriesId\'] must be valid');
				}
			})
			.then(function (): void {
				reply.send({
					id: request['params']['seriesMovieId'],
					index: request['body']['index'],
					subtitle: request['body']['subtitle']
				} satisfies Pick<SeriesMovie, 'id'> & Partial<Pick<SeriesMovie, 'index' | 'subtitle'>>)
				
				return;
			})
			.catch(reply.send.bind(reply));
		} else {
			reply.send(new BadRequest('Body must have more than one key'));
		}
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}