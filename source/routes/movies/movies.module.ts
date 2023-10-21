import Module from '@library/module';
import movieCommentsModule from './movieComments/movieComments.module';
import movieLikeModule from './movieLike/movieLike.module';
import movieStarModule from './movieStar/movieStar.module';
import movieStatisticsModule from './movieStatistics/movieStatistics.module';
import postMoviesController from './postMovies.controller';
import getMoviesController from './getMovies.controller';
import patchMovieController from './patchMovie.controller';
import getMovieController from './getMovie.controller';
import deleteMovieController from './deleteMovie.controller';
import movieSchema from '@schemas/movie';
import pageSchema from '@schemas/page';
import commonSchema from '@schemas/common';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMoviesController,
		schema: {
			body: {
				title: movieSchema['title'].required(),
				description: movieSchema['description'].required(),
				videoMediaId: movieSchema['videoMediaId'].required(),
				imageMediaId: movieSchema['imageMediaId'].required(),
				categoryId: movieSchema['categoryId'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getMoviesController,
		schema: {
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]'],
				'page[orderBy]': commonSchema['default'].string().enum(['likeCount', 'viewCount', 'starAverage', 'id']).default('id'),
				query: movieSchema['title'],
				categoryId: movieSchema['categoryId']
			}
		}
	}, {
		method: 'PATCH',
		url: ':movieId',
		handler: patchMovieController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			},
			body: {
				title: movieSchema['title'],
				description: movieSchema['description'],
				imageMediaId: movieSchema['imageMediaId'],
				categoryId: movieSchema['categoryId']
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':movieId',
		handler: getMovieController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':movieId',
		handler: deleteMovieController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: 'movies',
	modules: [movieCommentsModule, movieLikeModule, movieStarModule, movieStatisticsModule]
});