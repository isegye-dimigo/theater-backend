import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Partial<Pick<Movie, 'title' | 'description' | 'imageMediaId'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			prisma['movie'].count({
				where: {
					OR: [{
						userId: request['user']['id'],
						id: request['params']['movieId'],
						isDeleted: false
					}, {
						id: request['params']['movieId'],
						isDeleted: false
					}]
				}
			})
			.then(function (movieCount: number): Promise<Pick<Movie, 'id' | 'title' | 'description'> & {
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
				videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> & {
					mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration' | 'frameRate'> | null;
				};
			}> {
				switch(movieCount) {
					default: {
						return prisma['movie'].update({
							select: {
								id: true,
								title: true,
								description: true,
								imageMedia: {
									select: {
										id: true,
										hash: true,
										width: true,
										height: true,
										isVideo: true
									}
								},
								videoMedia: {
									select: {
										id: true,
										hash: true,
										width: true,
										height: true,
										isVideo: true,
										mediaVideoMetadata: {
											select: {
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
					}
					case 1: {
						throw new Unauthorized('User must be same');
					}
					case 0: {
						throw new NotFound('Parameter[\'movieId\'] must be valid');
					}
				}
			})
			.then(reply.send.bind(reply))
			.catch(reply.send.bind(reply));
		} else {
			reply.send(new BadRequest('Body must have more than one key'));
		}
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}