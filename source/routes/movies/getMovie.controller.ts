import authHandler from '@handlers/auth';
import { CATEGORYS } from '@library/constant';
import { kysely, redis } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Media, Movie, Episode, MovieStar, MovieStatistic, Request, Response, User, Category, PageQuery } from '@library/type';
import { JoinBuilder, SelectQueryBuilder, Transaction, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		let hasLoggedIn: boolean = true;
		
		try {
			authHandler(request);
		} catch {
			hasLoggedIn = false;
		}

		let movie: Pick<Movie, 'id' | 'title' | 'description' | 'createdAt'> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			category: Category;
			statistic: Pick<MovieStatistic, 'id' | 'viewCount' | 'commentCount' | 'starAverage'>;
			star?: Pick<MovieStar, 'id' | 'value'>;
			episodes?: (Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & {
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
			})[];
		};

		return transaction.selectFrom('movie')
		.select(['movie.id', 'movie.title', 'movie.description', 'movie.created_at as createdAt', 'movie.category_id as categoryId'])
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.innerJoin('user', 'movie.user_id', 'user.id')
		.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
		.innerJoin('media', 'movie.media_id', 'media.id')
		.select(['media.id as media_id', 'media.hash as media_hash', 'media.width as media_width', 'media.height as media_height'])
		.innerJoin('movie_statistic as statistic', 'movie.id', 'statistic.movie_id')
		.select(['statistic.id as statistic_id', 'statistic.view_count as statistic_viewCount', 'statistic.comment_count as statistic_commentCount', 'statistic.star_average as statistic_starAverage'])
		.innerJoin('current_movie_statistic as currentStatistic', 'statistic.id', 'currentStatistic.id')
		.$if(hasLoggedIn, function (queryBuilder: SelectQueryBuilder<Database & {
			statistic: Database['movie_statistic'];
			currentStatistic: Database['current_movie_statistic'];
		}, 'movie' | 'user' | 'media' | 'statistic' | 'currentStatistic', Pick<Movie, 'id' | 'title' | 'description' | 'createdAt' | 'categoryId'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'media_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MovieStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'starAverage'>>): SelectQueryBuilder<Database & {
			statistic: Database['movie_statistic'];
			currentStatistic: Database['current_movie_statistic'];
			star: Nullable<Database['movie_star']>;
		}, 'movie' | 'user' | 'media' | 'statistic' | 'currentStatistic' | 'star', Pick<Movie, 'id' | 'title' | 'description' | 'createdAt' | 'categoryId'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'media_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MovieStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'starAverage'> & Nullable<PrefixPick<MovieStar, 'star_', 'id' | 'value'>>> {
			return queryBuilder.leftJoin('movie_star as star', function (joinBuilder: JoinBuilder<Database & {
				star: Database['movie_star'];
			}, 'movie' | 'star'>): JoinBuilder<Database & {
				star: Database['movie_star'];
			}, 'movie' | 'star'> {
				return joinBuilder.onRef('movie.id', '=', 'star.movie_id')
				.on('star.user_id', '=', request['user']['id']);
			})
			.select(['star.id as star_id', 'star.value as star_value']);
		}).executeTakeFirst()
		.then(function (rawMovie?: Pick<Movie, 'id' | 'title' | 'description' | 'createdAt' | 'categoryId'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & PrefixPick<Media, 'media_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MovieStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'starAverage'> & Partial<Nullable<PrefixPick<MovieStar, 'star_', 'id' | 'value'>>>): Promise<(Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]> {
			if(typeof(rawMovie) !== 'undefined') {
				movie = {
					id: rawMovie['id'],
					title: rawMovie['title'],
					description: rawMovie['description'],
					createdAt: rawMovie['createdAt'],
					user: {
						id: rawMovie['user_id'],
						handle: rawMovie['user_handle'],
						name: rawMovie['user_name'],
						isVerified: rawMovie['user_isVerified']
					},
					media: {
						id: rawMovie['media_id'],
						hash: rawMovie['media_hash'],
						width: rawMovie['media_width'],
						height: rawMovie['media_height']
					},
					category: {
						id: rawMovie['categoryId'],
						title: CATEGORYS[rawMovie['categoryId']]
					},
					statistic: {
						id: rawMovie['statistic_id'],
						viewCount: rawMovie['statistic_viewCount'],
						commentCount: rawMovie['statistic_commentCount'],
						starAverage: rawMovie['statistic_starAverage']
					}
				};

				if(typeof(rawMovie['star_id']) === 'number') {
					movie['star'] = {
						id: rawMovie['star_id'],
						value: rawMovie['star_value'] as number
					}
				}

				return transaction.selectFrom('episode')
				.select(['episode.id', 'episode.index', 'episode.title', sql<string | null>`LEFT(episode.description, 256)`.as('description'), 'episode.created_at as createdAt'])
				.where('episode.movie_id', '=', request['parameter']['movieId'])
				.where('episode.is_deleted', '=', false)
				.orderBy('episode.index', request['query']['page[order]'] === 'desc' ? 'desc' : 'asc')
				.limit(request['query']['page[size]'])
				.offset(request['query']['page[size]'] * request['query']['page[index]'])
				.innerJoin('media as imageMedia', 'episode.image_media_id', 'imageMedia.id')
				.select(['imageMedia.id as imageMedia_id', 'imageMedia.hash as imageMedia_hash', 'imageMedia.width as imageMedia_width', 'imageMedia.height as imageMedia_height'])
				.execute();
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (episodes: (Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]): void {
			movie['episodes'] = [];

			for(let i: number = 0; i < episodes['length']; i++) {
				let slicedDescription: string | null = null;
	
				if(typeof(episodes[i]['description']) === 'string') {
					slicedDescription = (episodes[i]['description'] as string).replace(/(\n|\s)+/g, ' ');
	
					if(slicedDescription['length'] > 128) {
						slicedDescription = slicedDescription.slice(0, 128).trim() + '...';
					}
				}
				
				movie['episodes'].push({
					id: episodes[i]['id'],
					index: episodes[i]['index'],
					title: episodes[i]['title'],
					description: slicedDescription,
					createdAt: episodes[i]['createdAt'],
					imageMedia: {
						id: episodes[i]['imageMedia_id'],
						hash: episodes[i]['imageMedia_hash'],
						width: episodes[i]['imageMedia_width'],
						height: episodes[i]['imageMedia_height']
					}
				});
			}

			response.send(movie);

			redis.incr('movieView:' + request['parameter']['movieId'])
			.catch(request['server']['logger'].error);

			return;
		});
	});
}