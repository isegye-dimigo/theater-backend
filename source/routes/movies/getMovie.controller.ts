import { prisma, redis } from '@library/database';
import { BadRequest } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie, MovieStatistic, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
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
							id: true,
							hash: true,
							width: true,
							height: true
						}
					}
				}
			},
			title: true,
			description: true,
			videoMedia: {
				select: {
					id: true,
					hash: true,
					width: true,
					height: true,
					mediaVideoMetadata: {
						select: {
							duration: true,
							frameRate: true
						}
					}
				}
			},
			movieStatistics: {
				select: {
					viewCount: true,
					commentCount: true,
					likeCount: true,
					starAverage: true
				},
				take: 1,
				orderBy: {
					id: 'desc'
				}
			},
			createdAt: true
		},
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
			profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null;
		};
		videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
			mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration' | 'frameRate'> | null;
		};
		movieStatistics: Pick<MovieStatistic, 'viewCount' | 'commentCount' | 'likeCount' | 'starAverage'>[];
	} | null): void {
		if(movie !== null) {
			reply.send(movie);

			redis.incr('movieView:' + movie['id'])
			.catch(request['log'].error);

			return;
		} else {
			throw new BadRequest('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}