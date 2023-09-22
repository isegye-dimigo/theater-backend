import Module from '@library/module';
import getAdminMoviesController from './getAdminMovies.controller';
import deleteMovieController from 'source/routes/movies/deleteMovie.controller';
import adminHandler from '@handlers/admin';
import movieSchema from '@schemas/movie';
import adminMovieCommentsModule from './adminMovieComments/adminMovieComments.module';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminMoviesController,
		preValidation: adminHandler
	}, {
		method: 'DELETE',
		url: ':movieId',
		handler: deleteMovieController,
		preValidation: adminHandler,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			}
		}
	}],
	prefix: 'movies',
	modules: [adminMovieCommentsModule]
})