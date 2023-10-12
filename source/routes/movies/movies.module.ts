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

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMoviesController,
		schema: {
			body: {
				title: movieSchema.get('title').required(),
				description: movieSchema.get('description').required(),
				videoMediaId: movieSchema.get('videoMediaId').required(),
				imageMediaId: movieSchema.get('imageMediaId').required(),
				categoryId: movieSchema.get('categoryId').required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getMoviesController,
		schema: {
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]'),
				'page[orderBy]': pageSchema['defaultSchema'].string().enum(['likeCount', 'viewCount', 'starAverage', 'id']).default('id'),
				query: movieSchema.get('title'),
				categoryId: movieSchema.get('categoryId')
			}
		}
	}, {
		method: 'PATCH',
		url: ':movieId',
		handler: patchMovieController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			},
			body: {
				title: movieSchema.get('title'),
				description: movieSchema.get('description'),
				imageMediaId: movieSchema.get('imageMediaId'),
				categoryId: movieSchema.get('categoryId')
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':movieId',
		handler: getMovieController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':movieId',
		handler: deleteMovieController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: 'movies',
	modules: [movieCommentsModule, movieLikeModule, movieStarModule, movieStatisticsModule]
});