import Module from '@library/module';
import postMovieLikeController from './postMovieLike.controller';
import movieSchema from '@schemas/movie';
import deleteMovieLikeController from './deleteMovieLike.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMovieLikeController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: '',
		handler: deleteMovieLikeController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/like',
	modules: []
});