import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Movie, MovieComment } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
		movieCommentId: MovieComment['id'];
	};
	Body: Partial<Pick<MovieComment, 'time' | 'content'>>;
}>, reply: FastifyReply): void {
	if(Object.keys(request['body'])['length'] !== 0) {
		const isTimeDefined: boolean = typeof(request['body']['time']) === 'number';

		prisma['movie'].findUnique({
			select: {
				videoMedia: isTimeDefined ? {
					select: {
						mediaVideoMetadata: {
							select: {
								duration: true
							}
						}
					}
				} : undefined,
				movieComments: {
					select: {
						userId: true
					},
					where: {
						id: request['params']['movieCommentId'],
						isDeleted: false
					}
				}
			},
			where: {
				id: request['params']['movieId'],
				isDeleted: false
			}
		})
		// @ts-expect-error :: stupid typescript
		.then(function (movie: {
			videoMedia?: {
				mediaVideoMetadata: {
					duration: number;
				} | null;
			} | null;
			movieComments: Pick<MovieComment, 'userId'>[];
		} | null): Promise<Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'>> {
			if(movie !== null) {
				if(movie['movieComments']['length'] === 1) {
					if(movie['movieComments'][1]['userId'] === request['user']['id']) {
						if(!isTimeDefined || typeof(movie['videoMedia']) !== 'undefined' && movie['videoMedia'] !== null && movie['videoMedia']['mediaVideoMetadata'] !== null && request['body']['time'] as number < movie['videoMedia']['mediaVideoMetadata']['duration']) {
							return prisma['movieComment'].update({
								select: {
									id: true,
									time: true,
									content: true,
									createdAt: true
								},
								data: {
									content: request['body']['content'],
									time: request['body']['time']
								},
								where: {
									id: request['params']['movieCommentId'],
									isDeleted: false,
									movie: {
										id: request['params']['movieId'],
										isDeleted: false
									}
								}
							});
						} else {
							throw new BadRequest('Body[\'time\'] must be valid');
						}
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(reply.send.bind(reply))
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body must have more than one key'));
	}

	return;
}