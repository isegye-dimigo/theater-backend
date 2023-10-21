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
				movieId: movieSchema['id'].required()
			},
			body: {
				time: movieCommentSchema['time'].required(),
				content: movieCommentSchema['content'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getMovieCommentsController,
		schema: {
			params: {
				movieId: movieSchema['id'].required()
			},
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]']
			}
		}
	}, {
		method: 'PATCH',
		url: ':movieCommentId',
		handler: patchMovieCommentController,
		schema: {
			params: {
				movieId: movieSchema['id'].required(),
				movieCommentId: movieCommentSchema['id'].required()
			},
			body: {
				content: movieCommentSchema['content']
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: ':movieCommentId',
		handler: deleteMovieCommentController,
		schema: {
			params: {
				movieId: movieSchema['id'].required(),
				movieCommentId: movieCommentSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/comments',
	modules: []
});