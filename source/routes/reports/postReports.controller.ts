import { prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import { Prisma, Report } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<Report, 'type' | 'targetId'>;
}>, reply: FastifyReply): void {
	let validation: Prisma.PrismaPromise<number> | undefined;

	switch(request['body']['type']) {
		case 0:
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8: {
			validation = prisma['user'].count({
				where: {
					id: request['body']['targetId'],
					verificationKey: null,
					isDeleted: false
				}
			});

			break;
		}

		case 10:
		case 11:
		case 12:
		case 13:
		case 14:
		case 15:
		case 16:
		case 17: {
			validation = prisma['movie'].count({
				where: {
					id: request['body']['targetId'],
					isDeleted: false
				}
			});

			break;
		}

		case 20:
		case 21:
		case 22:
		case 23:
		case 24:
		case 25:
		case 26:
		case 27: {
			validation = prisma['movieComment'].count({
				where: {
					id: request['body']['targetId'],
					isDeleted: false
				}
			});

			break;
		}
	}

	if(typeof(validation) === 'object') {
		validation
		.then(function (targetCount: number): Promise<Prisma.BatchPayload> {
			if(targetCount === 1) {
				return prisma['report'].createMany({
					data: {
						userId: request['user']['id'],
						type: request['body']['type'],
						targetId: request['body']['targetId']
					}
				});
			} else {
				throw new BadRequest('Body[\'targetId\'] must be valid');
			}
		})
		.then(function (result: Prisma.BatchPayload): void {
			if(result['count'] === 1) {
				reply.status(201).send(null);

				return;
			} else {
				throw new BadRequest('Body[\'targetId\'] must be valid');
			}
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new BadRequest('Body[\'targetId\'] must be valid'));
	}

	return;
}