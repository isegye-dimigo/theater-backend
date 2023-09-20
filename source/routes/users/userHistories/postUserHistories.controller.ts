import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Movie, Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Body: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	Promise.all([prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	}), prisma['movie'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['body']['movieId'],
			isDeleted: false
		}
	})])
	.then(function (results: [Pick<User, 'id'> | null, Pick<Movie, 'id'> | null]): Promise<Prisma.BatchPayload> {
		if(results[0] !== null) {
			if(request['user']['id'] === results[0]['id']) {
				if(results[1] !== null) {
					return prisma['userHistory'].createMany({
						data: {
							userId: results[0]['id'],
							movieId: request['body']['movieId']
						}
					});
				} else {
					throw new BadRequest('Body[\'movieId\'] must be valid');
				}
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(201).send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}