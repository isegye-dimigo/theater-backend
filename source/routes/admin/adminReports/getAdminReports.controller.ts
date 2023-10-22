import { prisma } from '@library/database';
import { PageQuery } from '@library/type';
import { Prisma, Report, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	prisma['report'].findMany({
		select: {
			id: true,
			type: true,
			user: {
				select: {
					email: true,
					handle: true,
					name: true
				}
			},
			targetId: true
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
	.then(function (reports: (Pick<Report, 'id' | 'type'> & Partial<Pick<Report, 'targetId'>> & {
		user: Pick<User, 'email' | 'handle' | 'name'>;
		target?: unknown;
	})[]): Promise<unknown[]> {
		const targetPromises: Prisma.PrismaPromise<unknown>[] = [];

		for(let i: number = 0; i < reports['length']; i++) {
			switch(reports[i]['type']) {
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
				case 8: {
					targetPromises.push(prisma['user'].findUnique({
						select: {
							id: true,
							handle: true,
							name: true
						},
						where: {
							id: reports[i]['targetId'],
							isDeleted: false
						}
					}));

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
					targetPromises.push(prisma['movie'].findUnique({
						select: {
							id: true,
							title: true
						},
						where: {
							id: reports[i]['targetId'],
							isDeleted: false
						}
					}));

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
					targetPromises.push(prisma['movieComment'].findUnique({
						select: {
							id: true,
							movieId: true,
							content: true
						},
						where: {
							id: reports[i]['targetId'],
							isDeleted: false,
							movie: {
								isDeleted: false
							}
						}
					}));

					break;
				}
			}
		}

		return Promise.all(targetPromises)
		.then(function (results: unknown[]): (Pick<Report, 'id' | 'type'> & Partial<Pick<Report, 'targetId'>> & {
			user: Pick<User, 'email' | 'handle' | 'name'>;
			target?: unknown;
		})[] {
			for(let i: number = 0; i < reports['length']; i++) {
				reports[i]['target'] = results[i];
				reports[i]['targetId'] = undefined;
			}

			return reports;
		});
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}