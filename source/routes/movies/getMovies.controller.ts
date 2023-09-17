import { prisma } from '@library/database';
import { PageQuery } from '@library/type';
import { Media, MediaVideoMetadata, Movie, MovieStatistic, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery & {
		'page[rank]': 'id' | 'viewCount' | 'commentCount' | 'starAverage';
	};
}>, reply: FastifyReply): void {
	let orderBy: string;

	if(request['query']['page[rank]'] === 'id') {
		orderBy = 'movie.id ' + request['query']['page[order]'];
	} else {
		switch(request['query']['page[rank]']) {
			case 'viewCount': {
				orderBy = 'movie_statistic.view_count';

				break;
			}
			case 'commentCount': {
				orderBy = 'movie_statistic.comment_count';

				break;
			}
			case 'starAverage': {
				orderBy = 'movie_statistic.star_average';

				break;
			}
		}

		orderBy +=  ' ' + request['query']['page[order]'] + ', movie.id DESC';
	}

	prisma.$queryRawUnsafe<({
		created_at: Date;
		user_is_verified: boolean;
	} & Record<'id' | 'user_id' | 'user_profile_media_id' | 'user_profile_media_width' | 'user_profile_media_height' | 'image_media_id' | 'image_media_width' | 'image_media_height' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'user_handle' | 'user_name' | 'user_profile_media_hash' | 'image_media_hash', string> & Record<'movie_statistic_star_average' | 'video_media_media_video_metadata_duration' | 'video_media_media_video_metadata_frame_rate', number>)[]>(`
	SELECT
	movie.id, movie.title, movie.created_at,
	user.id AS user_id, user.handle AS user_handle, user.name AS user_name, user.is_verified AS user_is_verified,
	user_profile_media.id AS user_profile_media_id, user_profile_media.hash AS user_profile_media_hash, user_profile_media.width AS user_profile_media_width, user_profile_media.height AS user_profile_media_height,
	image_media.id AS image_media_id, image_media.hash AS image_media_hash, image_media.width AS image_media_width, image_media.height AS image_media_height,
	media_video_metadata.duration AS video_media_media_video_metadata_duration, media_video_metadata.frame_rate AS video_media_media_video_metadata_frame_rate,
	movie_statistic.view_count AS movie_statistic_view_count, movie_statistic.comment_count AS movie_statistic_comment_count, movie_statistic.like_count AS movie_statistic_like_count, movie_statistic.star_average AS movie_statistic_star_average
	FROM movie 
	INNER JOIN user ON movie.user_id = user.id 
	INNER JOIN media AS image_media ON movie.image_media_id = image_media.id 
	LEFT JOIN media AS user_profile_media ON user.profile_media_id = user_profile_media.id 
	INNER JOIN media_video_metadata ON movie.video_media_id = media_video_metadata.media_id
	INNER JOIN movie_statistic ON movie.id = movie_statistic.movie_id 
	INNER JOIN (SELECT max(id) AS id FROM movie_statistic GROUP BY movie_id) AS _movie_statistics ON movie_statistic.id = _movie_statistics.id
	WHERE movie.is_deleted = 0
	ORDER BY ${orderBy} LIMIT ${request['query']['page[size]']} OFFSET ${request['query']['page[size]'] * request['query']['page[index]']}
	`)
	.then(function (rawMovies: ({
		created_at: Date;
		user_is_verified: boolean;
	} & Record<'id' | 'user_id' | 'user_profile_media_id' | 'user_profile_media_width' | 'user_profile_media_height' | 'image_media_id' | 'image_media_width' | 'image_media_height' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'user_handle' | 'user_name' | 'user_profile_media_hash' | 'image_media_hash', string> & Record<'movie_statistic_star_average' | 'video_media_media_video_metadata_duration' | 'video_media_media_video_metadata_frame_rate', number>)[]) {

		const movies: (Pick<Movie, 'id' | 'title' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
				profileMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null;
			};
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			videoMedia: {
				mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration' | 'frameRate'>;
			};
			movieStatistics: Pick<MovieStatistic, 'viewCount' | 'commentCount' | 'likeCount' | 'starAverage'>[];
		})[] = [];

		for(let i: number = 0; i < rawMovies['length']; i++) {
			movies.push({
				id: Number(rawMovies[i]['id']),
				user: {
					id: Number(rawMovies[i]['user_id']),
					handle: rawMovies[i]['user_handle'],
					name: rawMovies[i]['user_name'],
					isVerified: rawMovies[i]['user_is_verified'],
					profileMedia: {
						id: Number(rawMovies[i]['user_profile_media_id']),
						hash: rawMovies[i]['user_profile_media_hash'],
						width: Number(rawMovies[i]['user_profile_media_width']),
						height: Number(rawMovies[i]['user_profile_media_height'])
					}
				},
				title: rawMovies[i]['title'],
				imageMedia: {
					id: Number(rawMovies[i]['image_media_id']),
					hash: rawMovies[i]['image_media_hash'],
					width: Number(rawMovies[i]['image_media_width']),
					height: Number(rawMovies[i]['image_media_height'])
				},
				videoMedia: {
					mediaVideoMetadata: {
						duration: rawMovies[i]['video_media_media_video_metadata_duration'],
						frameRate: rawMovies[i]['video_media_media_video_metadata_frame_rate']
					}
				},
				movieStatistics: [{
						viewCount: Number(rawMovies[i]['movie_statistic_view_count']),
						commentCount: Number(rawMovies[i]['movie_statistic_comment_count']),
						likeCount: Number(rawMovies[i]['movie_statistic_like_count']),
						starAverage: Number(rawMovies[i]['movie_statistic_star_average'])
				}],
				createdAt: rawMovies[i]['created_at']
			})
		}

		reply.send(movies);
	})
	.catch(reply.send.bind(reply));

	return;
}