import Module from '@library/module';
import adminHandler from '@handlers/admin';
import deleteAdminMovieCommentController from './deleteAdminMovieComment.controller';
import { SchemaType } from '@library/constant';
import movieCommentSchema from '@schemas/movieComment';

export default new Module([{
	method: 'DELETE',
	path: ':movieCommentId',
	handlers: [adminHandler, deleteAdminMovieCommentController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieCommentSchema['movieId'],
				movieCommentId: movieCommentSchema['id']
			}
		}
	}
}], ':movieId/comments', []);