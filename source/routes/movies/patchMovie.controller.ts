import { prisma, redis } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Category, Media, MediaVideo, Movie, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Partial<Pick<Movie, 'title' | 'description' | 'imageMediaId' | 'categoryId'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			prisma['movie'].findUnique({
				select: {
					userId: true
				},
				where: {
					id: request['params']['movieId'],
					isDeleted: true
				}
			})
			.then(function (movie: Pick<Movie, 'userId'> | null): Promise<void[]> {
				if(movie !== null) {
					if(movie['userId'] === request['user']['id']) {
						const validationPromises: Promise<void>[] = [];

						if(typeof(request['body']['imageMediaId']) === 'number') {
							validationPromises.push(prisma['media'].findUnique({
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
							})
							.then(function (media: {
								mediaVideo: Pick<MediaVideo, 'id'> | null;
							} | null): void {
								if(media !== null) {
									if(media['mediaVideo'] !== null) {
										return;
									} else {
										throw new BadRequest('Body[\'imageMediaId\'] must not be video');
									}
								} else {
									throw new BadRequest('Body[\'imageMediaId\'] must be valid');
								}
							}));
						}

						if(typeof(request['body']['categoryId']) === 'number') {
							validationPromises.push(prisma['category'].findUnique({
								select: {
									id: true
								},
								where: {
									id: request['body']['categoryId']
								}
							})
							.then(function (category: Pick<Category, 'id'> | null): void {
								if(category !== null) {
									return;
								} else {
									throw new BadRequest('Body[\'categoryId\'] must be valid');
								}
							}));
						}

						return Promise.all(validationPromises);
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (): Promise<Pick<Movie, 'id' | 'title' | 'description'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
					mediaVideo: Pick<MediaVideo, 'id' | 'duration' | 'frameRate'> | null;
				};
			}> {
				return prisma['movie'].update({
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
						}
					},
					data: {
						title: request['body']['title'],
						description: request['body']['description'],
						imageMediaId: request['body']['imageMediaId']
					},
					where: {
						id: request['params']['movieId'],
						isDeleted: false
					}
				});
			})
			.then(function (movie: Pick<Movie, 'id' | 'title' | 'description'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
					mediaVideo: Pick<MediaVideo, 'id' | 'duration' | 'frameRate'> | null;
				};
			}): void {
				reply.send(movie);

				if(typeof(request['body']['title']) === 'string' || typeof(request['body']['description']) === 'string') {
					redis.set('movieIndex:update:' + request['params']['movieId'], JSON.stringify({
						title: request['body']['title'],
						description: request['body']['description']
					}))
					.catch(request['log'].error);
				}

				return;
			})
			.catch(reply.send.bind(reply));
		} else {
			reply.send(new BadRequest('Body must have more than one key'));
		}
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}