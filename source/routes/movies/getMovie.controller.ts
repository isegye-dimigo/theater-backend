import { prisma, redis } from '@library/database';
import { BadRequest } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie, MovieLike, MovieStar, MovieStatistic, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	prisma['movie'].findUnique({
		select: Object.assign({
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
			videoMedia: {
				select: {
					id: true,
					hash: true,
					width: true,
					height: true,
					isVideo: true,
					mediaVideoMetadata: {
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
		} as const, typeof(request['user']) === 'object' ? {
			movieLikes: {
				where: {
					userId: request['user']['id']
				}
			},
			movieStars: {
				where: {
					userId: request['user']['id']
				}
			}
		} as const : undefined),
		where: {
			id: request['params']['movieId'],
			isDeleted: false
		}
	})
	.then(function (movie: Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
		videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> & {
			mediaVideoMetadata: Pick<MediaVideoMetadata, 'id' | 'duration' | 'frameRate'> | null;
		};
		movieLikes?: MovieLike[];
		movieStars?: MovieStar[];
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