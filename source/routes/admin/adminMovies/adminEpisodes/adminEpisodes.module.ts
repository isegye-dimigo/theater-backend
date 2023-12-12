import Module from '@library/module';
import adminEpisodeCommentsModule from './adminEpisodeComments/adminEpisodeComments.module';
import adminHandler from '@handlers/admin';
import deleteAdminEpisodeController from './deleteAdminEpisode.controller';
import { SchemaType } from '@library/constant';
import episodeSchema from '@schemas/episode';

export default new Module([{
	method: 'DELETE',
	path: ':episodeId',
	handlers: [adminHandler, deleteAdminEpisodeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeSchema['id']
			}
		}
	}
}], ':movieId/episodes', [adminEpisodeCommentsModule]);