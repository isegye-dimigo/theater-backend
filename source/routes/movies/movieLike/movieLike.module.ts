import Module from '@library/module';
import postMovieLikeController from './postMovieLike.controller';
import deleteMovieLikeController from './deleteMovieLike.controller';
import movieLikeSchema from '@schemas/movieLike';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMovieLikeController,
		schema: {
			params: {
				movieId: movieLikeSchema['movieId'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: '',
		handler: deleteMovieLikeController,
		schema: {
			params: {
				movieId: movieLikeSchema['movieId'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/like',
	modules: []
});