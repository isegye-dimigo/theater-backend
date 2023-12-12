import { Media, Movie, MovieStatistic, PageQuery, Request, Response, User } from '@library/type';
import { CATEGORYS } from '@library/constant';
import { elasticsearch, kysely } from '@library/database';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { sql } from 'kysely';

export default function (request: Request<{
	query: PageQuery & {
		'page[orderBy]': 'id' | 'viewCount' | 'commentCount' | 'starAverage';
		categoryId?: keyof typeof CATEGORYS;
		query?: string;
	};
}>, response: Response): Promise<void> {
	let condition: Promise<string> | string;

	if(typeof(request['query']['query']) === 'string') {
		condition = elasticsearch.search({
			index: 'movie',
			size: request['query']['page[size]'],
			from: request['query']['page[size]'] * request['query']['page[index]'],
			_source: false,
			min_score: 1,
			query: {
				multi_match: {
					query: request['query']['query'],
					fields: ['title', 'title.nori^0.9', 'title.ngram^0.7', 'description^0.5', 'description.nori^0.45', 'description.ngram^0.35']
				}
			}
		})
		.then(function (result: SearchResponse): string {
			if(result['hits']['hits']['length'] !== 0) {
				let condition: string = '';

				for(let i: number = 0; i < result['hits']['hits']['length']; i++) {
					condition += result['hits']['hits'][i]['_id'] + ',';
				}

				condition = condition.slice(0, -1);

				return ' AND movie.id IN (' + condition + ') ORDER BY FIELD(movie.id,' + condition + ')';
			} else {
				return '';
			}

		});
	} else {
		if(typeof(request['query']['categoryId']) === 'number') {
			condition = ' movie.category_id = ' + request['query']['categoryId'];
		} else {
			condition = ' ORDER BY ';
	
			if(request['query']['page[orderBy]'] === 'id') {
				condition += 'movie.id ' + request['query']['page[order]'];
			} else {
				switch(request['query']['page[orderBy]']) {
					case 'viewCount': {
						condition += 'statistic.view_count';
	
						break;
					}
					case 'commentCount': {
						condition += 'statistic.comment_count';
	
						break;
					}
					case 'starAverage': {
						condition += 'statistic.star_average';
	
						break;
					}
				}
	
				condition +=  ' ' + request['query']['page[order]'] + ', movie.id DESC';
			}
		}

		condition += ' LIMIT ' + request['query']['page[size]'] + ' OFFSET ' + request['query']['page[size]'] * request['query']['page[index]'];
	}

	return Promise.resolve(condition)
	.then(function (condition: string): Promise<(Pick<Movie, 'id' | 'title' | 'description' | 'categoryId' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'media_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MovieStatistic, 'statistic_', 'id' | 'viewCount' | 'starAverage'>)[]> {
		return kysely.selectFrom('movie')
		.select(['movie.id', 'movie.title', sql<string | null>`LEFT(movie.description, 256)`.as('description'), 'movie.category_id as categoryId', 'movie.created_at as createdAt'])
		.innerJoin('user', 'movie.user_id', 'user.id')
		.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
		.innerJoin('media', 'movie.media_id', 'media.id')
		.select(['media.id as media_id', 'media.hash as media_hash', 'media.width as media_width', 'media.height as media_height'])
		.innerJoin('movie_statistic as statistic', 'movie.id', 'statistic.movie_id')
		.select(['statistic.id as statistic_id', 'statistic.view_count as statistic_viewCount', 'statistic.star_average as statistic_starAverage'])
		.innerJoin('current_movie_statistic as currentStatistic', 'statistic.id', 'currentStatistic.id')
		.where(sql`movie.is_deleted = 0${sql.raw(condition)}`)
		.execute();
	})
	.then(function (rawMovies: (Pick<Movie, 'id' | 'title' | 'description' | 'categoryId' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'media_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MovieStatistic, 'statistic_', 'id' | 'viewCount' | 'starAverage'>)[]): void {
		const movies: (Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			category: {
				id: number;
				title: string;
			};
			statistic: Pick<MovieStatistic, 'id' | 'viewCount' | 'starAverage'>;
		})[] = [];

		for(let i: number = 0; i < rawMovies['length']; i++) {
			let slicedDescription: string | null = null;

			if(typeof(rawMovies[i]['description']) === 'string') {
				slicedDescription = (rawMovies[i]['description'] as string).replace(/(\n|\s)+/g, ' ');

				if(slicedDescription['length'] > 128) {
					slicedDescription = slicedDescription.slice(0, 128).trim() + '...';
				}
			}
			
			movies.push({
				id: rawMovies[i]['id'],
				title: rawMovies[i]['title'],
				description: slicedDescription,
				createdAt: rawMovies[i]['createdAt'],
				user: {
					id: rawMovies[i]['user_id'],
					handle: rawMovies[i]['user_handle'],
					name: rawMovies[i]['user_name'],
					isVerified: rawMovies[i]['user_isVerified']
				},
				media: {
					id: rawMovies[i]['media_id'],
					hash: rawMovies[i]['media_hash'],
					width: rawMovies[i]['media_width'],
					height: rawMovies[i]['media_height']
				},
				category: {
					id: rawMovies[i]['categoryId'],
					title: CATEGORYS[rawMovies[i]['categoryId']]
				},
				statistic: {
					id: rawMovies[i]['statistic_id'],
					viewCount: rawMovies[i]['statistic_viewCount'],
					starAverage: rawMovies[i]['statistic_starAverage']
				}
			});
		}

		response.send(movies);

		return;
	});
}