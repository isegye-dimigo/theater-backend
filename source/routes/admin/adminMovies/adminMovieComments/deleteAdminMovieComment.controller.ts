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
	prisma['movie'].findUnique({
		select: {
			movieComments: {
				select: {
					id: true
				},
				where: {
					id: request['params']['movieCommentId']
				}
			}
		},
		where: {
			id: request['params']['movieId']
		}
	})
	.then(function (movie: {
		movieComments: Pick<MovieComment, 'id'>[];
	} | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			if(movie['movieComments']['length'] === 1) {
				return prisma['movieComment'].updateMany({
					data: {
						isDeleted: true
					},
					where: {
						id: request['params']['movieId']
					}
				});
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
			throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}