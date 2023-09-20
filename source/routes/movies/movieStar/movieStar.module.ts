import Module from '@library/module';
import movieSchema from '@schemas/movie';
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
				movieId: movieSchema.get('id').required()
			},
			body: {
				value: movieStarSchema.get('value').required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: '',
		handler: deleteMovieStarController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/star',
	modules: []
});