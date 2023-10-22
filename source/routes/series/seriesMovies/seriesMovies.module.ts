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
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required()
			},
			body: {
				movieId: seriesMovieSchema['movieId'].required(),
				subtitle: seriesMovieSchema['subtitle'].default(null)
			}
		},
		isAuthNeeded: true
	}, {
		method: 'PATCH',
		url: ':seriesMovieId',
		handler: patchSeriesMovieController,
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required(),
				seriesMovieId: seriesMovieSchema['id'].required()
			},
			body: {
				index: seriesMovieSchema['index'],
				subtitle: seriesMovieSchema['subtitle']
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: ':seriesMovieId',
		handler: deleteSeriesMovieController,
		schema: {
			params: {
				seriesId: seriesMovieSchema['seriesId'].required(),
				seriesMovieId: seriesMovieSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':seriesId/movies',
	modules: []
});