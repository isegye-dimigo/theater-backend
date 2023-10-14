import Module from '@library/module';
import adminHandler from '@handlers/admin';
import deleteAdminMovieController from './deleteAdminMovie.controller';
import adminMovieCommentsModule from './adminMovieComments/adminMovieComments.module';
import movieSchema from '@schemas/movie';

export default new Module({
	routers: [{
		method: 'DELETE',
		url: ':movieId',
		handler: deleteAdminMovieController,
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