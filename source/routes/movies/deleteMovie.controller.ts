import { prisma } from '@library/database';
import { InternalServerHttpError, NotFound, Unauthorized } from '@library/httpError';
import { Movie, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			userId: true
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: Pick<Movie, 'userId'> | null): Promise<Prisma.BatchPayload> {
		if(movie !== null) {
			if(request['user']['id'] === movie['userId']) {
				return prisma['movie'].updateMany({
					data: {
						isDeleted: true
					},
					where: {
						id: request['params']['movieId'],
						isDeleted: false
					}
				})
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));
	
	return;
}