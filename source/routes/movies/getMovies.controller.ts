import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { elasticsearch, prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import { PageQuery, RejectFunction, ResolveFunction } from '@library/type';
import { Category, Media, MediaVideoMetadata, Movie, MovieStatistic, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: PageQuery & {
		'page[orderBy]': 'id' | 'viewCount' | 'commentCount' | 'starAverage';
		categoryId?: Category['id'];
		query?: string;
	};
}>, reply: FastifyReply): void {
	new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
		if(typeof(request['query']['query']) === 'string') {
			elasticsearch.search({
				index: 'movie',
				size: request['query']['page[size]'],
				from: request['query']['page[size]'] * request['query']['page[index]'],
				//min_score: 1,
				_source: false,
				"min_score": 1,
				"query": {
						"multi_match": {
								"query": request['query']['query'],
								"fields": ["title", "title.nori^0.9", "title.ngram^0.7", "description^0.5", "description.nori^0.45", "description.ngram^0.35"]
						}
				}
			})
			.then(function (result: SearchResponse): void {
				if(result['hits']['hits']['length'] !== 0) {
					let condition: string = '';
	
					for(let i: number = 0; i < result['hits']['hits']['length']; i++) {
						condition += result['hits']['hits'][i]['_id'] + ',';
					}

					condition = condition.slice(0, -1);

					resolve('AND movie.id IN (' + condition + ') ORDER BY FIELD(movie.id,' + condition + ')');
				} else {
					resolve('');
				}

				return;
			})
			.catch(reject);
		} else if(typeof(request['query']['categoryId']) === 'number') {
			prisma['category'].findUnique({
				select: {
					id: true
				},
				where: {
					id: request['query']['categoryId']
				}
			})
			.then(function (category: Pick<Category, 'id'> | null): void {
				if(category !== null) {
					resolve(' LIMIT ' + request['query']['page[size]'] + ' OFFSET ' + request['query']['page[size]'] * request['query']['page[index]']);
				} else {
					reject(new BadRequest('Query[\'categoryId\'] must be valid'));
				}

				return;
			})
			.catch(reject);
		} else {
			let condition: string = 'ORDER BY ';

			if(request['query']['page[orderBy]'] === 'id') {
				condition += 'movie.id ' + request['query']['page[order]'];
			} else {
				switch(request['query']['page[orderBy]']) {
					case 'viewCount': {
						condition = 'movie_statistic.view_count';
		
						break;
					}
					case 'commentCount': {
						condition = 'movie_statistic.comment_count';
		
						break;
					}
					case 'starAverage': {
						condition = 'movie_statistic.star_average';
		
						break;
					}
				}
		
				condition +=  ' ' + request['query']['page[order]'] + ', movie.id DESC';
			}

			resolve(condition + ' LIMIT ' + request['query']['page[size]'] + ' OFFSET ' + request['query']['page[size]'] * request['query']['page[index]']);
		}
		
		return;
	})
	.then(function (condition: string): Promise<({
		created_at: Date;
		user_is_verified: boolean;
	} & Record<'id' | 'user_id' | 'image_media_id' | 'image_media_width' | 'image_media_height' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'user_handle' | 'user_name' | 'image_media_hash' | 'category_title', string> & Record<'video_media_media_video_metadata_id' | 'category_id' | 'movie_statistic_star_average' | 'video_media_media_video_metadata_duration' | 'image_media_is_video', number>)[]> | [] {
		return condition['length'] !== 0 ? prisma.$queryRawUnsafe<({
			created_at: Date;
			user_is_verified: boolean;
		} & Record<'id' | 'user_id' | 'image_media_id' | 'image_media_width' | 'image_media_height' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'user_handle' | 'user_name' | 'image_media_hash' | 'category_title', string> & Record<'video_media_media_video_metadata_id' | 'category_id' | 'movie_statistic_star_average' | 'video_media_media_video_metadata_duration' | 'image_media_is_video', number>)[]>(`
		SELECT
		movie.id, movie.title, movie.created_at,
		user.id AS user_id, user.handle AS user_handle, user.name AS user_name, user.is_verified AS user_is_verified,
		image_media.id AS image_media_id, image_media.hash AS image_media_hash, image_media.width AS image_media_width, image_media.height AS image_media_height, image_media.is_video AS image_media_is_video,
		media_video_metadata.id AS video_media_media_video_metadata_id, media_video_metadata.duration AS video_media_media_video_metadata_duration,
		category.id AS category_id, category.title AS category_title,
		movie_statistic.view_count AS movie_statistic_view_count, movie_statistic.comment_count AS movie_statistic_comment_count, movie_statistic.like_count AS movie_statistic_like_count, movie_statistic.star_average AS movie_statistic_star_average
		FROM movie 
		INNER JOIN user ON movie.user_id = user.id 
		INNER JOIN media AS image_media ON movie.image_media_id = image_media.id 
		INNER JOIN media_video_metadata ON movie.video_media_id = media_video_metadata.media_id 
		INNER JOIN category ON movie.category_id = category.id
		INNER JOIN movie_statistic ON movie.id = movie_statistic.movie_id 
		INNER JOIN (SELECT max(id) AS id FROM movie_statistic GROUP BY movie_id) AS _movie_statistics ON movie_statistic.id = _movie_statistics.id
		WHERE movie.is_deleted = 0
		` + condition) : [];
	})
	.then(function (rawMovies: ({
		created_at: Date;
		user_is_verified: boolean;
	} & Record<'id' | 'user_id' | 'image_media_id' | 'image_media_width' | 'image_media_height' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'user_handle' | 'user_name' | 'image_media_hash' | 'category_title', string> & Record<'video_media_media_video_metadata_id' | 'category_id' | 'movie_statistic_star_average' | 'video_media_media_video_metadata_duration' | 'image_media_is_video', number>)[]) {
		const movies: (Pick<Movie, 'id' | 'title' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
			videoMedia: {
				mediaVideoMetadata: Pick<MediaVideoMetadata, 'id' | 'duration'>;
			};
			category: Category;
			movieStatistics: Pick<MovieStatistic, 'viewCount' | 'commentCount' | 'likeCount' | 'starAverage'>[];
		})[] = [];

		for(let i: number = 0; i < rawMovies['length']; i++) {
			movies.push({
				id: Number(rawMovies[i]['id']),
				user: {
					id: Number(rawMovies[i]['user_id']),
					handle: rawMovies[i]['user_handle'],
					name: rawMovies[i]['user_name'],
					isVerified: rawMovies[i]['user_is_verified']
				},
				title: rawMovies[i]['title'],
				imageMedia: {
					id: Number(rawMovies[i]['image_media_id']),
					hash: rawMovies[i]['image_media_hash'],
					width: Number(rawMovies[i]['image_media_width']),
					height: Number(rawMovies[i]['image_media_height']),
					isVideo: Boolean(rawMovies[i]['image_media_is_video'])
				},
				videoMedia: {
					mediaVideoMetadata: {
						id: Number(rawMovies[i]['video_media_media_video_metadata_id']),
						duration: rawMovies[i]['video_media_media_video_metadata_duration']
					}
				},
				category: {
					id: Number(rawMovies[i]['category_id']),
					title: rawMovies[i]['category_title']
				},
				movieStatistics: [{
						viewCount: Number(rawMovies[i]['movie_statistic_view_count']),
						commentCount: Number(rawMovies[i]['movie_statistic_comment_count']),
						likeCount: Number(rawMovies[i]['movie_statistic_like_count']),
						starAverage: Number(rawMovies[i]['movie_statistic_star_average'])
				}],
				createdAt: rawMovies[i]['created_at']
			});
		}

		reply.send(movies);

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}