import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Media, Movie, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
		movieCommentId: MovieComment['id'];
	};
	Body: Partial<Pick<MovieComment, 'content'>>;
}>, reply: FastifyReply): void {
	prisma['movie'].count({
		where: {
			OR: [{
				id: request['params']['movieId'],
				isDeleted: false
			}, {
				id: request['params']['movieId'],
				isDeleted: false,
				movieComments: {
					some: {
						id: request['params']['movieCommentId'],
						isDeleted: false
					}
				}
			}]
		}
	})
	.then(function (movieCount: number): Promise<Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
			profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null;
		};
	}> {
		switch(movieCount) {
			default: {
				return prisma['movieComment'].update({
					select: {
						id: true,
						user: {
							select: {
								id: true,
								handle: true,
								name: true,
								profileMedia: {
									select: {
										hash: true,
										id: true,
										width: true,
										height: true
									}
								},
								isVerified: true
							}
						},
						time: true,
						content: true,
						createdAt: true
					},
					data: {
						content: request['body']['content']
					},
					where: {
						id: request['params']['movieCommentId'],
						isDeleted: false,
						movie: {
							id: request['params']['movieId'],
							isDeleted: false
						}
					}
				});
			}
			case 1: {
				throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
			}
			case 0: {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		}
	})
	.then(reply.status(204).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}