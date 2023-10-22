import Module from '@library/module';
import postSeriesMoviesController from './postSeriesMovies.controller';
import seriesMovieSchema from '@schemas/seriesMovie';
import patchSeriesMovieController from './patchSeriesMovie.controller';
import deleteSeriesMovieController from './deleteSeriesMovie.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postSeriesMoviesController,
		isAuthNeeded: true,
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required()
			},
			body: {
				movieId: seriesMovieSchema['movieId'].required(),
				subtitle: seriesMovieSchema['subtitle'].default(null)
			}
		}
	}, {
		method: 'PATCH',
		url: ':movieId',
		handler: patchSeriesMovieController,
		isAuthNeeded: true,
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required(),
				movieId: seriesMovieSchema['movieId'].required()
			},
			body: {
				index: seriesMovieSchema['index'],
				subtitle: seriesMovieSchema['subtitle']
			}
		}
	}, {
		method: 'DELETE',
		url: ':movieId',
		handler: deleteSeriesMovieController,
		isAuthNeeded: true,
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required(),
				movieId: seriesMovieSchema['movieId'].required()
			}
		}
	}],
	prefix: ':seriesId/movies',
	modules: []
});