import authHandler from '@handlers/auth';
import Module from '@library/module';
import postEpisodeLikeController from './postEpisodeLike.controller';
import deleteEpisodeLikeController from './deleteEpisodeLike.controller';
import { SchemaType } from '@library/constant';
import episodeLikeSchema from '@schemas/episodeLike';
import episodeSchema from '@schemas/episode';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postEpisodeLikeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeLikeSchema['episodeId']
			}
		}
	}
}, {
	method: 'DELETE',
	path: '',
	handlers: [authHandler, deleteEpisodeLikeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeLikeSchema['episodeId']
			}
		}
	}
}], ':episodeId/star');