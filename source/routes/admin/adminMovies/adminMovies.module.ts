import Module from '@library/module';
import adminHandler from '@handlers/admin';
import getAdminMoviesController from './getAdminMovies.controller';
import deleteMovieController from 'source/routes/movies/deleteMovie.controller';
import adminMovieCommentsModule from './adminMovieComments/adminMovieComments.module';
import movieSchema from '@schemas/movie';

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