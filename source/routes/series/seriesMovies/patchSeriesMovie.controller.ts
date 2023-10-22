import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Prisma, Series, SeriesMovie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: SeriesMovie['seriesId'];
		movieId: SeriesMovie['movieId'];
	};
	Body: Partial<Pick<SeriesMovie, 'index' | 'subtitle'>>;
}>, reply: FastifyReply): void {
	if(Object.keys(request['body'])['length'] !== 0) {
		const isIndexDefined: boolean = typeof(request['body']['index']) === 'number';
		const selection: Partial<Record<'id' | 'index' | 'subtitle', true>> = {
			id: true
		};

		if(isIndexDefined) {
			Object.assign(selection, {
				index: true,
				subtitle: true
			});
		}

		// @ts-expect-error :: stupid typescript
		const promises: [Promise<Pick<Series, 'userId'> | null>, Promise<Pick<SeriesMovie, 'id' | 'index' | 'subtitle'> | null>, Promise<{ index: number; }[] | undefined>] = [prisma['series'].findUnique({
			select: {
				userId: true
			},
			where: {
				id: request['params']['seriesId']
			}
		}), prisma['seriesMovie'].findUnique({
			select: selection,
			where: {
				seriesId: request['params']['seriesId'],
				movieId: request['params']['movieId']
			}
		})];

		if(isIndexDefined) {
			promises.push(prisma.$queryRawUnsafe<{
				index: number;
			}[]>(`
			SELECT MAX(\`index\`) AS \`index\` 
			FROM movie_series 
			WHERE series_id = ` + request['params']['seriesId'])); 
		}

		Promise.all(promises)
		.then(function (results: [Pick<Series, 'userId'> | null, Pick<SeriesMovie, 'id' | 'index' | 'subtitle'> | null, { index: number; }[] | undefined]): Promise<(number | Prisma.BatchPayload)[]> {
			if(results[0] !== null) {
				if(results[0]['userId'] === request['user']['id']) {
					if(results[1] !== null) {
						const promises: Prisma.PrismaPromise<number | Prisma.BatchPayload>[] = [];
	
						if(isIndexDefined) {
							if((results[2] as NonNullable<typeof results[2]>)['length'] === 1) {
								if(0 <= (request['body']['index'] as number) && (request['body']['index'] as number) <= (results[2] as NonNullable<typeof results[2]>)[0]['index']) {
									if(results[1]['index'] !== (request['body']['index'] as number)) {
										promises.push(prisma.$executeRawUnsafe(`
										DELETE FROM series_movie 
										WHERE series_id = ` + request['params']['seriesId'] + ` AND movie_id = ` + request['params']['movieId']), prisma.$executeRawUnsafe(`
										UPDATE series_movie SET \`index\` = \`index\` ` + (results[1]['index'] < (request['body']['index'] as number) ?
										`+ 1 WHERE series_id = ` + request['params']['seriesId'] + ` AND \'index\' >= ` + request['body']['index'] + ` AND \'index\' < ` : 
										`- 1 WHERE series_id = ` + request['params']['seriesId'] + ` AND \'index\' <= ` + request['body']['index'] + ` AND \'index\' > `)
										+ results[1]['index']), prisma.$executeRaw`
										INSERT INTO series_movie 
										(id, series_id, movie_id, \`index\`, subtitle) 
										VALUES (${results[1]['id']}, ${request['params']['seriesId']}, ${request['params']['movieId']}, ${request['body']['index']}, ${results[1]['subtitle']})
										`);
									}
								} else {
									throw new BadRequest('Body[\'index\'] must be valid');
								}
							} else {
								throw new NotFound('Parameter[\'seriesId\'] must be valid');
							}
						}
						
						if(typeof(request['body']['subtitle']) === 'string') {
							promises.push(prisma['seriesMovie'].updateMany({
								data: {
									subtitle: request['body']['subtitle']
								},
								where: {
									seriesId: request['params']['seriesId'],
									movieId: request['params']['movieId']
								}
							}));
						}
	
						return prisma.$transaction(promises);
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
		.then(function (): void {
			reply.status(201).send();

			return;
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body must have more than one key'));
	}

	return;
}