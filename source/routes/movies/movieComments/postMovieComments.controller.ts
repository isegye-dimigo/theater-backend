import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Media, Movie, MovieComment, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Pick<MovieComment, 'time' | 'content'>;
}>, reply: FastifyReply): void {
	prisma['movie'].count({
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movieCount: number): Promise<Pick<MovieComment, 'id' | 'time' | 'content' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
			profileMedia: Pick<Media, 'id' | 'hash' | 'type' | 'width' | 'height'> | null;
		};
	}> {
		if(movieCount === 1) {
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
							profileMedia: {
								select: {
									hash: true,
									id: true,
									type: true,
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
				}
			});
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}