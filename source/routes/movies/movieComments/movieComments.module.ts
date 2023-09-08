import Module from '@library/module';
import getMovieCommentsController from './getMovieComments.controller';
import pageSchema from '@schemas/page';
import postMovieCommentsController from './postMovieComments.controller';
import movieSchema from '@schemas/movie';
import movieCommentSchema from '@schemas/movieComment';
import deleteMovieCommentController from './deleteMovieComment.controller';
import patchMovieCommentController from './patchMovieComment.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMovieCommentsController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			},
			body: {
				time: movieCommentSchema.get('time').required(),
				content: movieCommentSchema.get('content').required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getMovieCommentsController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			},
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]')
			}
		}
	}, {
		method: 'PATCH',
		url: ':movieCommentId',
		handler: patchMovieCommentController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required(),
				movieCommentId: movieCommentSchema.get('id').required()
			},
			body: {
				content: movieCommentSchema.get('content')
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: ':movieCommentId',
		handler: deleteMovieCommentController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required(),
				movieCommentId: movieCommentSchema.get('id').required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/comments',
	modules: []
});