import adminHandler from '@handlers/admin';
import { SchemaType } from '@library/constant';
import Module from '@library/module';
import deleteAdminEpisodeCommentController from './deleteAdminEpisodeComment.controller';
import episodeSchema from '@schemas/episode';
import episodeCommentSchema from '@schemas/episodeComment';

export default new Module([{
	method: 'DELETE',
	path: ':movieEpisodeCommentId',
	handlers: [adminHandler, deleteAdminEpisodeCommentController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeCommentSchema['episodeId'],
				movieEpisodeCommentId: episodeCommentSchema['id']
			}
		}
	}
}], ':episodeId/comments');