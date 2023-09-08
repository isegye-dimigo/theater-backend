import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Movie, MovieComment, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
		movieCommentId: MovieComment['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].count({
		where: {
			OR: [{
				id: request['params']['movieId'],
				isDeleted: false
			}, {
				id: request['params']['movieId'],
				isDeleted: false,
				movieComments: {
					some: {
						id: request['params']['movieCommentId'],
						isDeleted: false
					}
				}
			}]
		}
	})
	.then(function (movieCount: number): Promise<Prisma.BatchPayload> {
		switch(movieCount) {
			default: {
				return prisma['movieComment'].updateMany({
					data: {
						isDeleted: true
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
			}
			case 1: {
				throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
			}
			case 0: {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.send(204).send(null);
		} else {
			throw new NotFound('Parameter[\'movie~Id\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}