import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Prisma, Series } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: Series['id'];
	};
}>, reply: FastifyReply): void {
	prisma['series'].findUnique({
		select: {
			userId: true
		},
		where: {
			id: request['params']['seriesId']
		}
	})
	.then(function (series: Pick<Series, 'userId'> | null): Promise<Prisma.BatchPayload> {
		if(series !== null) {
			if(series['userId'] === request['user']['id']) {
				return prisma['series'].deleteMany({
					where: {
						id: request['params']['seriesId']
					}
				});
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply))
	
	return;
}