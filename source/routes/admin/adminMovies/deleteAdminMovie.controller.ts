import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Movie, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['movieId']
		}
	})
	.then(function (movie: Pick<Movie, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			return prisma['movie'].updateMany({
				data: {
					isDeleted: true
				},
				where: {
					id: request['params']['movieId'],
					isDeleted: false
				}
			});
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}