import { prisma } from '@library/database';
import { PageQuery } from '@library/type';
import { reportTypes } from '@library/utility';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	if(request['user']['id'] !== 0) {
		reply.send({
			reportTypes: reportTypes
		});
	} else {
		prisma['report'].findMany({
			select: {
				id: true,
				type: true,
				targetUser: {
					select: {
						handle: true
					}
				},
				targetMovie: {
					select: {
						id: true
					}
				},
				targetMovieComment: {
					select: {
						id: true,
						movieId: true
					}
				}
			},
			where: {
				isDeleted: false
			},
			skip: request['query']['page[size]'] * request['query']['page[index]'],
			take: request['query']['page[size]'],
			orderBy: {
				id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc'
			}
		})
		.then(reply.send.bind(reply))
		.catch(reply.send.bind(reply));
	}
	
	return;
}