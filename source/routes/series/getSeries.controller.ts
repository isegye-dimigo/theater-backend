import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { PageQuery, RawSeries, RawSeriesMovie } from '@library/type';
import { Media, Movie, Series, SeriesMovie, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: Series['id'];
	};
	Querystring: PageQuery;
}>, reply: FastifyReply): void {
	let series: (Omit<Series, 'userId' | 'mediaId'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
		media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
		seriesMovies: (Pick<SeriesMovie, 'id' | 'index' | 'subtitle'> & {
			movie: Pick<Movie, 'id' | 'title'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			};
		})[];
	});

	prisma.$queryRaw<RawSeries[]>`SELECT series.id, series.title, series.description, series.created_at, user.id AS user_id, user.handle AS user_handle, user.name AS user_name, user.is_verified AS user_is_verified, media.id AS media_id, media.hash AS media_hash, media.width AS media_width, media.height AS media_height FROM series INNER JOIN user ON series.user_id = user.id INNER JOIN media ON series.media_id = media.id WHERE series.id = ${request['params']['seriesId']}`
	.then(function (rawSeries: RawSeries[]): Promise<RawSeriesMovie[]> {
		if(rawSeries['length'] === 1) {
			series = {
				id: Number(rawSeries[0]['id']),
				user: {
					id: Number(rawSeries[0]['user_id']),
					handle: rawSeries[0]['user_handle'],
					name: rawSeries[0]['user_name'],
					isVerified: rawSeries[0]['user_is_verified']
				},
				media: {
					id: Number(rawSeries[0]['media_id']),
					hash: rawSeries[0]['media_hash'],
					width: rawSeries[0]['media_width'],
					height: rawSeries[0]['media_height']
				},
				title: rawSeries[0]['title'],
				description: rawSeries[0]['description'],
				createdAt: rawSeries[0]['created_at'],
				seriesMovies: []
			};
		
			return prisma.$queryRaw<RawSeriesMovie[]>`SELECT series_movie.id, series_movie.series_id, series_movie.index, series_movie.subtitle, movie.id AS movie_id, movie.title AS movie_title, movie_user.id AS movie_user_id, movie_user.handle AS movie_user_handle, movie_user.name AS movie_user_name, movie_user.is_verified AS movie_user_is_verified, movie_image_media.id AS movie_image_media_id, movie_image_media.hash AS movie_image_media_hash, movie_image_media.width AS movie_image_media_width, movie_image_media.height AS movie_image_media_height FROM series_movie INNER JOIN movie ON series_movie.movie_id = movie.id AND movie.is_deleted = 0 INNER JOIN user AS movie_user ON movie.user_id = movie_user.id INNER JOIN media AS movie_image_media ON movie.image_media_id = movie_image_media.id WHERE series_movie.series_id = ${request['params']['seriesId']} ORDER BY series_movie.index`;
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (rawSeriesMovies: RawSeriesMovie[]): void {
		for(let i: number = 0; i < rawSeriesMovies['length']; i++) {
			series['seriesMovies'].push({
				id: Number(rawSeriesMovies[i]['id']),
				index: rawSeriesMovies[i]['index'],
				subtitle: rawSeriesMovies[i]['subtitle'],
				movie: {
					id: Number(rawSeriesMovies[i]['movie_id']),
					user: {
						id: Number(rawSeriesMovies[i]['movie_user_id']),
						handle: rawSeriesMovies[i]['movie_user_handle'],
						name: rawSeriesMovies[i]['movie_user_name'],
						isVerified: rawSeriesMovies[i]['movie_user_is_verified']
					},
					title: rawSeriesMovies[i]['movie_title'],
					imageMedia: {
						id: Number(rawSeriesMovies[i]['movie_image_media_id']),
						hash: rawSeriesMovies[i]['movie_image_media_hash'],
						width: rawSeriesMovies[i]['movie_image_media_width'],
						height: rawSeriesMovies[i]['movie_image_media_height']
					}
				}
			});
		}

		reply.send(series);

		return;
	})
	.catch(reply.send.bind(reply));
	
	return;
}