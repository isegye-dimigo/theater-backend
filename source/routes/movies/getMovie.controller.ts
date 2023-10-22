import { prisma, redis } from '@library/database';
import { NotFound } from '@library/httpError';
import { Movie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import authHandler from '@handlers/auth';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
}>, reply: FastifyReply): void {
	let isLoggedIn: boolean = false;
	
	authHandler(request, reply, function (error?: Error | null): void {
		if(typeof(error) === 'undefined') {
			isLoggedIn = true;
		}

		return;
	});

	prisma.$queryRawUnsafe<({
		user_is_verified: boolean;
	} & Record<'created_at' | 'movie_like_created_at' | 'movie_star_created_at', Date> & Record<'id' | 'user_id' | 'image_media_id' | 'video_media_id' | 'category_id' | 'video_media_media_video_id' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count' | 'movie_like_id' | 'movie_star_id', BigInt> & Record<'title' | 'description' | 'user_handle' | 'user_name' | 'image_media_hash' | 'video_media_hash' | 'category_title', string> & Record<'image_media_width' | 'image_media_height' | 'video_media_width' | 'video_media_height' | 'movie_statistic_star_average' | 'video_media_media_video_duration' | 'movie_star_value', number>)[]>('SELECT movie.id, movie.title, movie.description, movie.created_at, user.id AS user_id, user.handle AS user_handle, user.name AS user_name, user.is_verified AS user_is_verified, image_media.id AS image_media_id, image_media.hash AS image_media_hash, image_media.width AS image_media_width, image_media.height AS image_media_height, video_media.id AS video_media_id, video_media.hash AS video_media_hash, video_media.width AS video_media_width, video_media.height AS video_media_height, media_video.id AS video_media_media_video_id, media_video.duration AS video_media_media_video_duration, category.id AS category_id, category.title AS category_title, movie_statistic.view_count AS movie_statistic_view_count, movie_statistic.comment_count AS movie_statistic_comment_count, movie_statistic.like_count AS movie_statistic_like_count, movie_statistic.star_average AS movie_statistic_star_average' + (isLoggedIn ? ', movie_like.id AS movie_like_id, movie_like.created_at AS movie_like_created_at, movie_star.id AS movie_star_id, movie_star.value AS movie_star_value, movie_star.created_at AS movie_star_created_at' : '') + ' FROM movie INNER JOIN user ON movie.user_id = user.id INNER JOIN media AS image_media ON movie.image_media_id = image_media.id INNER JOIN media AS video_media ON movie.video_media_id = video_media.id INNER JOIN media_video ON movie.video_media_id = media_video.media_id INNER JOIN category ON movie.category_id = category.id INNER JOIN movie_statistic ON movie.id = movie_statistic.movie_id INNER JOIN (SELECT max(id) AS id FROM movie_statistic GROUP BY movie_id) AS _movie_statistics ON movie_statistic.id = _movie_statistics.id' + (isLoggedIn ? ' LEFT JOIN movie_like ON movie.id = movie_like.movie_id AND movie_like.user_id = ' + request['user']['id'] + ' LEFT JOIN movie_star ON movie.id = movie_star.movie_id AND movie_star.user_id = ' + request['user']['id'] : '') + ' WHERE movie.is_deleted = 0 AND movie.id = ' + request['params']['movieId'])
	.then(function (rawMovies: ({
		user_is_verified: boolean;
	} & Record<'created_at' | 'movie_like_created_at' | 'movie_star_created_at', Date> & Record<'id' | 'user_id' | 'image_media_id' | 'video_media_id' | 'category_id' | 'video_media_media_video_id' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count' | 'movie_like_id' | 'movie_star_id', BigInt> & Record<'title' | 'description' | 'user_handle' | 'user_name' | 'image_media_hash' | 'video_media_hash' | 'category_title', string> & Record<'image_media_width' | 'image_media_height' | 'video_media_width' | 'video_media_height' | 'movie_statistic_star_average' | 'video_media_media_video_duration' | 'movie_star_value', number>)[]) {
		if(rawMovies['length'] === 1) {
			reply.send(Object.assign({
				id: Number(rawMovies[0]['id']),
				user: {
					id: Number(rawMovies[0]['user_id']),
					handle: rawMovies[0]['user_handle'],
					name: rawMovies[0]['user_name'],
					isVerified: rawMovies[0]['user_is_verified']
				},
				title: rawMovies[0]['title'],
				description: rawMovies[0]['description'],
				imageMedia: {
					id: Number(rawMovies[0]['image_media_id']),
					hash: rawMovies[0]['image_media_hash'],
					width: rawMovies[0]['image_media_width'],
					height: rawMovies[0]['image_media_height']
				},
				videoMedia: {
					id: Number(rawMovies[0]['video_media_id']),
					hash: rawMovies[0]['video_media_hash'],
					width: rawMovies[0]['video_media_width'],
					height: rawMovies[0]['video_media_height'],
					mediaVideo: {
						id: Number(rawMovies[0]['video_media_media_video_id']),
						duration: Number(rawMovies[0]['video_media_media_video_duration'])
					}
				},
				category: {
					id: Number(rawMovies[0]['category_id']),
					title: rawMovies[0]['category_title']
				},
				movieStatistic: {
					viewCount: Number(rawMovies[0]['movie_statistic_view_count']),
					commentCount: Number(rawMovies[0]['movie_statistic_comment_count']),
					likeCount: Number(rawMovies[0]['movie_statistic_like_count']),
					starAverage: rawMovies[0]['movie_statistic_star_average']
				},
				createdAt: rawMovies[0]['created_at']
			}, isLoggedIn ? {
				movieLike: rawMovies[0]['movie_like_id'] !== null ? {
					id: Number(rawMovies[0]['movie_like_id']),
					createdAt: rawMovies[0]['movie_like_created_at']
				} : null,
				movieStar: rawMovies[0]['movie_star_id'] !== null ? {
					id: Number(rawMovies[0]['movie_star_id']),
					value: rawMovies[0]['movie_star_value'],
					created_at: rawMovies[0]['movie_star_created_at']
				} : null
			} : undefined));

			redis.incr('movieView:' + rawMovies[0]['id'])
			.catch(request['log'].error);

			return;
		} else {
			throw new NotFound('Parameter[\'movieId\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}