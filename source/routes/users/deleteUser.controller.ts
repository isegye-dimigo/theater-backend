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
	.then(function (user: Pick<User, 'id'> | null): Promise<void> {
		if(user !== null) {
			if(request['user']['id'] === user['id']) {
				return prisma.$transaction([prisma['user'].updateMany({
					where: {
						id: user['id'],
						isDeleted: false
					},
					data: {
						isDeleted: true,
						bannerMediaId: null,
						profileMediaId: null
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
				}), prisma.$executeRaw`UPDATE media LEFT JOIN used_media ON media.id = used_media.id SET media.is_deleted = 1 WHERE used_media.id IS NULL AND media.user_id = ${user['id']}`])
				.then(function (results: [...Prisma.BatchPayload[], number]) {
					if((results[0] as Prisma.BatchPayload)['count'] === 1) {
						reply.send(null);

						return;
					} else {
						throw new NotFound('Parameter[\'userHandle\'] must be valid');
					}
				});
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}