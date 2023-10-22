import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { MovieComment, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: MovieComment['movieId'];
		movieCommentId: MovieComment['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
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
	.then(function (movie: {
		movieComments: Pick<MovieComment, 'userId'>[]
	} | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			if(movie['movieComments']['length'] === 1) {
				if(movie['movieComments'][0]['userId'] === request['user']['id']) {
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
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'movie~Id\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}