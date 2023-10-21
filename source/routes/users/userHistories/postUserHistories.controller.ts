import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { MediaVideo, Prisma, User, UserHistory } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Body: Pick<UserHistory, 'movieId' | 'duration'>;
}>, reply: FastifyReply): void {
	Promise.all([prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	}), prisma['movie'].findUnique({
		select: {
			videoMedia: {
				select: {
					mediaVideo: {
						select: {
							duration: true
						}
					}
				}
			}
		},
		where: {
			id: request['body']['movieId'],
			isDeleted: false
		}
	})])
	.then(function (results: [Pick<User, 'id'> | null, {
		videoMedia: {
			mediaVideo: Pick<MediaVideo, 'duration'> | null;
		}
	} | null]): Promise<Prisma.BatchPayload> {
		if(results[0] !== null) {
			if(request['user']['id'] === results[0]['id']) {
				if(results[1] !== null) {
					if(results[1]['videoMedia']['mediaVideo'] !== null && request['body']['duration'] <= results[1]['videoMedia']['mediaVideo']['duration']) {
						return prisma['userHistory'].createMany({
							data: {
								userId: results[0]['id'],
								movieId: request['body']['movieId'],
								duration: request['body']['duration']
							}
						});
					} else {
						throw new BadRequest('Body[\'duration\'] must be valid');
					}
				} else {
					throw new BadRequest('Body[\'movieId\'] must be valid');
				}
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.then(function (result: Prisma.BatchPayload): void {
		if(result['count'] === 1) {
			reply.status(201).send(null);

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}