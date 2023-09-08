import { prisma } from '@library/database';
import { PageQuery } from '@library/type';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['movie'].findMany({
		select: {
			id: true,
			user: {
				select: {
					id: true,
					handle: true,
					name: true,
					profileMedia: {
						select: {
							id: true,
							hash: true,
							type: true,
							width: true,
							height: true
						}
					}
				}
			},
			title: true,
			description: true,
			imageMedia: {
				select: {
					id: true,
					hash: true,
					type: true,
					width: true,
					height: true
				}
			},
			movieStatistics: {
				select: {
					viewCount: true,
					commentCount: true,
					likeCount: true,
					starAverage: true
				},
				take: 1,
				orderBy: {
					id: 'desc'
				}
			},
			createdAt: true
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

	return;
}