import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import JsonWebToken from '@library/jsonWebToken';
import { Prisma, Report } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		reportId: Report['id'];
	};
}>, reply: FastifyReply): void {
	if(typeof(request['headers']['authorization']) === 'string') {
		const jsonWebToken: JsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET']);

		if(jsonWebToken.isValid()) {
			request['user'] = {
				id: jsonWebToken['payload']['uid'],
				handle: jsonWebToken['payload']['hdl'],
				isVerified: jsonWebToken['payload']['vrf'],
			};
		}
	}

	if(typeof(request['user']) === 'object' && request['user']['id'] === 0) {
		prisma['report'].count({
			where: {
				id: request['params']['reportId'],
				isDeleted: false
			}
		})
		.then(function (reportCount: number): Promise<Prisma.BatchPayload> {
			if(reportCount === 1) {
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
	} else {
		reply.callNotFound();
	}

	return;
}