import authHandler from '@handlers/auth';
import Module from '@library/module';
import postMovieCommentsController from './postMovieComments.controller';
import { SchemaType } from '@library/constant';
import movieComment from '@schemas/movieComment';
import getMovieCommentsController from './getMovieComments.controller';
import pageSchema from '@schemas/page';
import patchMovieCommentController from './patchMovieComment.controller';
import deleteMovieCommentController from './deleteMovieComment.controller';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postMovieCommentsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieComment['movieId']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				content: movieComment['content']
			}
		}
	}
}, {
	method: 'GET',
	path: '',
	handlers: [getMovieCommentsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieComment['movieId']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: pageSchema
		}
	}
}, {
	method: 'PATCH',
	path: ':movieCommentId',
	handlers: [authHandler, patchMovieCommentController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieComment['movieId'],
				movieCommentId: movieComment['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				content: movieComment['content']
			}
		}
	}
}, {
	method: 'DELETE',
	path: ':movieCommentId',
	handlers: [authHandler, deleteMovieCommentController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieComment['movieId'],
				movieCommentId: movieComment['id']
			}
		}
	}
}], ':movieId/comments');