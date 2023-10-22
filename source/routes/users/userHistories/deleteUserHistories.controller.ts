import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { PageQuery } from '@library/type';
import { Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
				return prisma['userHistory'].deleteMany({
					where: {
						userId: user['id']
					}
				});
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (): void {
		reply.send(204).send();

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}