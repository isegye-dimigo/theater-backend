import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import { Category } from '@prisma/client';
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
	.then(function (category: Pick<Category, 'id'> | null): Promise<Category> {
		if(category === null) {
			return prisma['category'].create({
				data: {
					title: request['body']['title']
				}
			});
		} else {
			throw new Conflict('Body[\'title\'] must be unique');
		}
	})
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}