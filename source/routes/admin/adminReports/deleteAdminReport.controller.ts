import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Prisma, Report } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		reportId: Report['id'];
	};
}>, reply: FastifyReply): void {
	prisma['report'].findUnique({
		select: {
			id: true
		},
		where: {
			id: request['params']['reportId'],
			isDeleted: false
		}
	})
	.then(function (report: Pick<Report, 'id'> | null): Promise<Prisma.BatchPayload> {
		if(report !== null) {
			return prisma['report'].updateMany({
				data: {
					isDeleted: true
				},
				where: {
					id: request['params']['reportId']
				}
			});
		} else {
			throw new NotFound('Parameter[\'reportId\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'reportId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}