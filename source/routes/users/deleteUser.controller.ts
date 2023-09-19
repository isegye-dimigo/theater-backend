import { prisma } from '@library/database';
import { NotFound, Unauthorized } from '@library/httpError';
import { Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id'> | null): Promise<Prisma.BatchPayload[]> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
				return prisma.$transaction([
					prisma['media'].updateMany({
						data: {
							isDeleted: true
						},
						where: {
							userId: user['id'],
							OR: [{
								videoMovie: {
									userId: user['id']
								}
							}, {
								profileUser: {
									id: user['id']
								}
							}, {
								bannerUser: {
									id: user['id']
								}
							}]
						}
					}), prisma['movie'].updateMany({
						data: {
							isDeleted: true
						},
						where: {
							userId: user['id']
						}
					}), prisma['movieComment'].updateMany({
						data: {
							isDeleted: true
						},
						where: {
							userId: user['id']
						}
					}), prisma['movieLike'].deleteMany({
						where: {
							userId: user['id']
						}
					}), prisma['movieStar'].deleteMany({
						where: {
							userId: user['id']
						}
					}), prisma['movieStatistic'].deleteMany({
						where: {
							movie: {
								userId: user['id']
							}
						}
					}), prisma['report'].updateMany({
						data: {
							isDeleted: true
						},
						where: {
							userId: user['id']
						}
					}), prisma['userHistory'].deleteMany({
						where: {
							userId: user['id']
						}
					}), prisma['user'].updateMany({
						where: {
							id: user['id'],
							isDeleted: false
						},
						data: {
							isDeleted: true,
							bannerMediaId: null,
							profileMediaId: null
						}
					})
				]);
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload[]): void {
		if(result[0]['count'] === 1) {
			reply.status(204).send();

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}