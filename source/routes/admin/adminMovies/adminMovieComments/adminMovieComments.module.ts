import Module from '@library/module';
import getAdminMovieCommentsController from './getAdminMovieComments.controller';
import adminHandler from '@handlers/admin';
import movieSchema from '@schemas/movie';
import deleteAdminMovieCommentController from './deleteAdminMovieComment.controller';
import movieCommentSchema from '@schemas/movieComment';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminMovieCommentsController,
		preValidation: adminHandler,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':movieCommentId',
		handler: deleteAdminMovieCommentController,
		preValidation: adminHandler,
		schema: {
			params: {
				movieId: movieSchema.get('id').required(),
				movieCommentId: movieCommentSchema.get('id').required()
			}
		}
	}],
	prefix: ':movieId/comments',
	modules: []
});