import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Media, MediaVideo, Movie, User, UserHistory } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
	Body: Pick<UserHistory, 'movieId' | 'duration'>;
}>, reply: FastifyReply): void {
	prisma.$transaction([prisma['user'].findUnique({
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
	} | null]): Promise<Pick<UserHistory, 'id' | 'duration' | 'createdAt'> & {
		movie: Pick<Movie, 'id' | 'title'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			videoMedia: {
				mediaVideo: Pick<MediaVideo, 'duration'> | null;
			};
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
		};
	}> {
		if(results[0] !== null) {
			if(request['user']['id'] === results[0]['id']) {
				if(results[1] !== null) {
					if(results[1]['videoMedia']['mediaVideo'] !== null && request['body']['duration'] <= results[1]['videoMedia']['mediaVideo']['duration']) {
						return prisma['userHistory'].create({
							select: {
								id: true,
								movie: {
									select: {
										id: true,
										user: {
											select: {
												id: true,
												handle: true,
												name: true,
												isVerified: true
											}
										},
										title: true,
										videoMedia: {
											select: {
												mediaVideo: {
													select: {
														duration: true
													}
												}
											}
										},
										imageMedia: {
											select: {
												id: true,
												hash: true,
												width: true,
												height: true
											}
										}
									}
								},
								duration: true,
								createdAt: true
							},
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
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}