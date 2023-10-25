import { prisma, redis } from '@library/database';
import { BadRequest, Unauthorized } from '@library/httpError';
import { Category, Media, MediaVideo, Movie, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<Movie, 'title' | 'description' | 'videoMediaId' | 'imageMediaId' | 'categoryId'>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		prisma.$transaction([prisma['media'].findUnique({
			select: {
				videoMovie: {
					select: {
						id: true
					}
				},
				mediaVideo: {
					select: {
						id: true
					}
				}
			},
			where: {
				id: request['body']['videoMediaId'],
				isDeleted: false
			}
		}), prisma['media'].findUnique({
			select: {
				mediaVideo: {
					select: {
						id: true
					}
				}
			},
			where: {
				id: request['body']['imageMediaId'],
				isDeleted: false
			}
		}), prisma['category'].findUnique({
			select: {
				id: true
			},
			where: {
				id: request['body']['categoryId']
			}
		})])
		.then(function (results: [{
			videoMovie: Pick<Movie, 'id'> | null;
			mediaVideo: Pick<MediaVideo, 'id'> | null;
		} | null, {
			mediaVideo: Pick<MediaVideo, 'id'> | null;
		} | null, Pick<Category, 'id'> | null]): Promise<Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
				mediaVideo: Pick<MediaVideo, 'id' | 'duration' | 'frameRate'> | null;
			};
			category: Category;
		}> {
			if(results[0] !== null) {
				if(results[0]['mediaVideo'] !== null) {
					if(results[1] !== null) {
						if(results[1]['mediaVideo'] === null) {
							if(results[2] !== null) {
								return prisma['movie'].create({
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
										description: true,
										imageMedia: {
											select: {
												id: true,
												hash: true,
												width: true,
												height: true
											}
										},
										videoMedia: {
											select: {
												id: true,
												hash: true,
												width: true,
												height: true,
												mediaVideo: {
													select: {
														id: true,
														duration: true,
														frameRate: true
													}
												}
											}
										},
										category: {
											select: {
												id: true,
												title: true
											}
										},
										createdAt: true
									},
									data: {
										userId: request['user']['id'],
										title: request['body']['title'],
										description: request['body']['description'],
										videoMediaId: request['body']['videoMediaId'],
										imageMediaId: request['body']['imageMediaId'],
										categoryId: request['body']['categoryId'],
										movieStatistics: {
											createMany: {
												data: [{
													viewCount: 0,
													commentCount: 0,
													likeCount: 0,
													starAverage: 0
												}]
											}
										}
									}
								});
							} else {
								throw new BadRequest('Body[\'categoryId\'] must not be valid');
							}
						} else {
							throw new BadRequest('Body[\'imageMediaId\'] must not be video');
						}
					} else {
						throw new BadRequest('Body[\'imageMediaId\'] must be valid');
					}
				} else {
					throw new BadRequest('Body[\'videoMediaId\'] must be video');
				}
			} else {
				throw new BadRequest('Body[\'videoMediaId\'] must be valid');
			}
		})
		.then(function (movie: Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
				mediaVideo: Pick<MediaVideo, 'id' | 'duration' | 'frameRate'> | null;
			};
		}): void {
			reply.status(201).send(movie);

			redis.set('movieIndex:create:' + movie['id'], JSON.stringify({
				title: request['body']['title'],
				description: request['body']['description']
			}))
			.catch(request['log'].error);

			return;
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}