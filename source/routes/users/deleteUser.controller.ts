import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
}>, reply: FastifyReply): void {
	prisma['user'].findFirst({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			verificationKey: null,
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
				return prisma['user'].updateMany({
					where: {
						handle: request['params']['userHandle'],
						isDeleted: true
					},
					data: {
						isDeleted: true
					}
				});
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}