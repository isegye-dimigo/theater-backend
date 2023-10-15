import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import { Category, Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<Category, 'title'>;
}>, reply: FastifyReply): void {
	prisma['category'].findUnique({
		select: {
			id: true
		},
		where: {
			title: request['body']['title']
		}
	})
	.then(function (category: Pick<Category, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(category === null) {
			return prisma['category'].createMany({
				data: {
					title: request['body']['title']
				}
			});
		} else {
			throw new Conflict('Body[\'title\'] must be unique');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(201).send(null);

			return;
		} else {
			throw new Conflict('Body[\'title\'] must be unique');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}