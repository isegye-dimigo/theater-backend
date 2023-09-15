import { prisma } from '@library/database';
import JsonWebToken from '@library/jsonWebToken';
import { PageQuery } from '@library/type';
import { reportTypes } from '@library/utility';
import { Prisma, Report, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery;
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
		const reportTargets: Prisma.PrismaPromise<unknown>[] = [];
		let reports: (Pick<Report, 'id' | 'type' | 'targetId'> & {
			user: Pick<User, 'email' | 'handle' | 'name'>;
			target?: unknown;
		})[];

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
		.then(function (_reports: (Pick<Report, 'id' | 'type' | 'targetId'> & {
			user: Pick<User, 'email' | 'handle' | 'name'>;
		})[]): Promise<unknown[]> {
			reports = _reports;

			for(let i: number = 0; i < _reports['length']; i++) {
				switch(_reports[i]['type']) {
					case 0:
					case 1:
					case 2:
					case 3:
					case 4:
					case 5:
					case 6:
					case 7:
					case 8: {
						reportTargets.push(prisma['user'].findFirst({
							select: {
								id: true,
								handle: true,
								name: true
							},
							where: {
								id: _reports[i]['targetId'],
								verificationKey: null,
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
						reportTargets.push(prisma['movie'].findUnique({
							select: {
								id: true,
								title: true
							},
							where: {
								id: _reports[i]['targetId'],
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
						reportTargets.push(prisma['movieComment'].findUnique({
							select: {
								id: true,
								movieId: true,
								content: true
							},
							where: {
								id: _reports[i]['targetId'],
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

			return Promise.all(reportTargets);
			//return prisma.$transaction(reportTargets);
		})
		.then(function (reportTargets: unknown[]): void {
			for(let i: number = 0; i < reports['length']; i++) {
				reports[i]['target'] = reportTargets[i];
			}

			reply.send(reports);

			return;
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(reportTypes);
	}
	
	return;
}