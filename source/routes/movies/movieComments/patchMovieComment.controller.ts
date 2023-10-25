import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { MovieComment, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieComment['movieId'];
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
						mediaVideo: {
							select: {
								duration: true
							}
						}
					}
				} : false,
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
		// @ts-expect-error
		.then(function (movie: {
			videoMedia?: {
				mediaVideo: {
					duration: number;
				} | null;
			} | null;
			movieComments: Pick<MovieComment, 'userId'>[];
		} | null): Promise<Prisma.BatchPayload> {
			if(movie !== null) {
				if(movie['movieComments']['length'] === 1) {
					if(movie['movieComments'][0]['userId'] === request['user']['id']) {
						if(!isTimeDefined || typeof(movie['videoMedia']) !== 'undefined' && movie['videoMedia'] !== null && movie['videoMedia']['mediaVideo'] !== null && request['body']['time'] as number < movie['videoMedia']['mediaVideo']['duration']) {
							return prisma['movieComment'].updateMany({
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
		// @ts-expect-error
		.then(function (result: Prisma.BatchPayload): void {
			if(result['count'] === 1) {
				reply.send({
					id: request['params']['movieCommentId'],
					time: request['body']['time'],
					content: request['body']['content']
				} satisfies Pick<MovieComment, 'id'> & Partial<Pick<MovieComment, 'time' | 'content'>>);

				return;
			} else {
				throw new NotFound('Parameter[\'movie~Id\'] must be valid')
			}
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body must have more than one key'));
	}

	return;
}