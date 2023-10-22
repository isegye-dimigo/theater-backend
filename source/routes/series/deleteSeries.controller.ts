import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Prisma, Series } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: Series['id'];
	};
}>, reply: FastifyReply): void {
	prisma['series'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['seriesId']
		}
	})
	.then(function (series: Pick<Series, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(series !== null) {
			return prisma['series'].deleteMany({
				where: {
					id: request['params']['seriesId']
				}
			});
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply))
	
	return;
}