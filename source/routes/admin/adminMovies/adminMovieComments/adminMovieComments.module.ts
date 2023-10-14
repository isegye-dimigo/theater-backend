import Module from '@library/module';
import adminHandler from '@handlers/admin';
import deleteAdminMovieCommentController from './deleteAdminMovieComment.controller';
import movieSchema from '@schemas/movie';
import movieCommentSchema from '@schemas/movieComment';

export default new Module({
	routers: [{
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