import { prisma } from '@library/database';
import { PageQuery } from '@library/type';
import { Category } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery & {
		title?: Category['title'];
	};
}>, reply: FastifyReply): void {
	prisma['category'].findMany({
		where: {
			title: request['query']['title']
		},
		skip: request['query']['page[size]'] * request['query']['page[index]'],
		take: request['query']['page[size]'],
		orderBy: {
			id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));
	
	return;
}