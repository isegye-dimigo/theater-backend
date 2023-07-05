import { prisma } from '@library/database';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{ Querystring: PageQuery }>, reply: FastifyReply): void {
	prisma['user'].findMany({
		select: {
			id: true,
			email: true,
			handle: true,
			name: true,
			description: true,
			isVerified: true,
			createdAt: true,
			profileMedia: {
				select: {
					id: true,
					hash: true,
					type: true,
					size: true,
					parentMediaId: true,
					width: true,
					height: true,
					isVideo: true,
					createdAt: true,
					childMedias: true
				}
			},
			bannerMedia: {
				select: {
					id: true,
					hash: true,
					type: true,
					size: true,
					parentMediaId: true,
					width: true,
					height: true,
					isVideo: true,
					createdAt: true,
					childMedias: true
				}
			}
		},
		where: {
			verificationKey: null,
			isDeleted: false
		},
		skip: request['query']['page[size]'] * request['query']['page[index]'],
		take: request['query']['page[size]'],
		orderBy: { id: request['query']['page[order]'] === 'asc' ? 'asc' : 'desc' }
	})
	.then(reply.send)
	.catch(reply.send);

	return;
}