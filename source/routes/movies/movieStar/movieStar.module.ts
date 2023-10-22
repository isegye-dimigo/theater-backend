import Module from '@library/module';
import movieStarSchema from '@schemas/movieStar';
import postMovieStarController from './postMovieStar.controller';
import deleteMovieStarController from './deleteMovieStar.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMovieStarController,
		schema: {
			params: {
				movieId: movieStarSchema['movieId'].required()
			},
			body: {
				value: movieStarSchema['value'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: '',
		handler: deleteMovieStarController,
		schema: {
			params: {
				movieId: movieStarSchema['movieId'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/star',
	modules: []
});