import { prisma, redis } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { resolveInSequence } from '@library/utility';
import { Category, Media, MediaVideo, Movie, Prisma, PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Partial<Pick<Movie, 'title' | 'description' | 'imageMediaId' | 'categoryId'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			let imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;
			let category: Category | undefined;
			
			prisma['movie'].findUnique({
				select: {
					userId: true
				},
				where: {
					id: request['params']['movieId'],
					isDeleted: true
				}
			})
			.then(function (movie: Pick<Movie, 'userId'> | null): Promise<void> {
				if(movie !== null) {
					if(movie['userId'] === request['user']['id']) {
						return prisma.$transaction(function (prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">): Promise<void> {
							const validationPromises: Promise<void>[] = [];

							if(typeof(request['body']['imageMediaId']) === 'number') {
								validationPromises.push(prisma['media'].findUnique({
									select: {
										id: true,
										hash: true,
										width: true,
										height: true,
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
								.then(function (media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
									mediaVideo: Pick<MediaVideo, 'id'> | null;
								} | null): void {
									if(media !== null) {
										if(media['mediaVideo'] !== null) {
											imageMedia = {
												id: media['id'],
												hash: media['hash'],
												width: media['width'],
												height: media['height']
											};

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
										id: true,
										title: true
									},
									where: {
										id: request['body']['categoryId']
									}
								})
								.then(function (_category: Category | null): void {
									if(_category !== null) {
										category = _category;

										return;
									} else {
										throw new BadRequest('Body[\'categoryId\'] must be valid');
									}
								}));
							}

							return resolveInSequence(validationPromises);
						});
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (): Promise<Prisma.BatchPayload> {
				return prisma['movie'].updateMany({
					data: {
						title: request['body']['title'],
						description: request['body']['description'],
						imageMediaId: request['body']['imageMediaId'],
						categoryId: request['body']['categoryId']
					},
					where: {
						id: request['params']['movieId'],
						isDeleted: false
					}
				});
			})
			.then(function (result: Prisma.BatchPayload): void {
				if(result['count'] === 1) {
					reply.send({
						id: request['params']['movieId'],
						title: request['body']['title'],
						description: request['body']['description'],
						imageMedia: imageMedia,
						category: category
					} satisfies Pick<Movie, 'id'> & Partial<Pick<Movie, 'title' | 'description'> & {
						imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>,
						category: Category
					}>);
	
					if(typeof(request['body']['title']) === 'string' || typeof(request['body']['description']) === 'string') {
						redis.set('movieIndex:update:' + request['params']['movieId'], JSON.stringify({
							title: request['body']['title'],
							description: request['body']['description']
						}))
						.catch(request['log'].error);
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
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