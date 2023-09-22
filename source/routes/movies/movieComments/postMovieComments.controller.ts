import { prisma } from '@library/database';
import { BadRequest, NotFound } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Pick<MovieComment, 'time' | 'content'>;
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: {
			videoMedia: {
				select: {
					mediaVideoMetadata: {
						select: {
							duration: true
						}
					}
				}
			}
		}, 
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: {
		videoMedia: {
			mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration'> | null;
		};
	} | null): Promise<Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
			profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> | null;
		};
	}> {
		if(movie !== null) {
			if(movie['videoMedia']['mediaVideoMetadata'] !== null && request['body']['time'] <= movie['videoMedia']['mediaVideoMetadata']['duration']) {
				return prisma['movieComment'].create({
					data: {
						movieId: request['params']['movieId'],
						userId: request['user']['id'],
						time: request['body']['time'],
						content: request['body']['content']
					},
					select: {
						id: true,
						user: {
							select: {
								id: true,
								handle: true,
								name: true,
								isVerified: true,
								profileMedia: {
									select: {
										hash: true,
										id: true,
										width: true,
										height: true,
										isVideo: true
									}
								}
							}
						},
						time: true,
						content: true,
						createdAt: true
					}
				});
			} else {
				throw new BadRequest('Body[\'time\'] must be valid');
			}
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}