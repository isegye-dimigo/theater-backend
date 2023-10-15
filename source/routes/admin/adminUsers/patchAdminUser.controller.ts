import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userId: User['id'];
	};
	Body: Pick<User, 'isVerified'>;
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['userId'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(user !== null) {
			return prisma['user'].updateMany({
				data: {
					isVerified: request['body']['isVerified']
				},
				where: {
					id: request['params']['userId'],
					isDeleted: false
				}
			})
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}