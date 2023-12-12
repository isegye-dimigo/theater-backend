import Module from '@library/module';
import authHandler from '@handlers/auth';
import postEpisodeCommentsController from './postEpisodeComments.controller';
import getEpisodeCommentsController from './getEpisodeComments.controller';
import patchEpisodeCommentController from './patchEpisodeComment.controller';
import deleteEpisodeCommentController from './deleteEpisodeComment.controller';
import { SchemaType } from '@library/constant';
import episodeSchema from '@schemas/episode';
import episodeCommentSchema from '@schemas/episodeComment';
import pageSchema from '@schemas/page';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postEpisodeCommentsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeCommentSchema['episodeId']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				time: episodeCommentSchema['time'],
				content: episodeCommentSchema['content']
			}
		}
	}
}, {
	method: 'GET',
	path: '',
	handlers: [getEpisodeCommentsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeCommentSchema['episodeId']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: pageSchema
		}
	}
}, {
	method: 'PATCH',
	path: ':movieEpisodeCommentId',
	handlers: [authHandler, patchEpisodeCommentController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeCommentSchema['episodeId'],
				movieEpisodeCommentId: episodeCommentSchema['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				time: Object.assign({
					isOptional: true
				} as const, episodeCommentSchema['time']),
				content: Object.assign({
					isOptional: true
				} as const, episodeCommentSchema['content'])
			}
		}
	}
}, {
	method: 'DELETE',
	path: ':movieEpisodeCommentId',
	handlers: [authHandler, deleteEpisodeCommentController],
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