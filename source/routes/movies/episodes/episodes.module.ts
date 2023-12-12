import Module from '@library/module';
import authHandler from '@handlers/auth';
import postEpisodesController from './postEpisodes.controller';
import getEpisodesController from './getEpisodes.controller';
import getEpisodeController from './getEpisode.controller';
import patchEpisodeController from './patchEpisode.controller';
import deleteEpisodeController from './deleteEpisode.controller';
import { SchemaType } from '@library/constant';
import pageSchema, { pageOrderAscSchema } from '@schemas/page';
import episodeSchema from '@schemas/episode';
import episodeCommentsModule from './episodeComments/episodeComments.module';
import episodeLikeModule from './episodeLike/episodeLike.module';
import episodeStatisticsModule from './episodeStatistics/episodeStatistics.module';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postEpisodesController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				title: episodeSchema['title'],
				description: episodeSchema['description'],
				imageMediaId: episodeSchema['imageMediaId'],
				videoMediaId: episodeSchema['videoMediaId']
			}
		}
	}
}, {
	method: 'GET',
	path: '',
	handlers: [getEpisodesController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: Object.assign({}, pageSchema, {
				'page[order]': pageOrderAscSchema
			})
		}
	}
}, {
	method: 'GET',
	path: ':episodeId',
	handlers: [getEpisodeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeSchema['id']
			}
		}
	}
}, {
	method: 'PATCH',
	path: ':episodeId',
	handlers: [authHandler, patchEpisodeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeSchema['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				index: Object.assign({
					isOptional: true
				} as const, episodeSchema['index']),
				title: Object.assign({
					isOptional: true
				} as const, episodeSchema['title']),
				description: Object.assign({
					isOptional: true
				} as const, episodeSchema['description']),
				imageMediaId: Object.assign({
					isOptional: true
				} as const, episodeSchema['imageMediaId'])
			}
		}
	}
}, {
	method: 'DELETE',
	path: ':episodeId',
	handlers: [authHandler, deleteEpisodeController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeSchema['id']
			}
		}
	}
}], ':movieId/episodes', [episodeCommentsModule, episodeLikeModule, episodeStatisticsModule]);