import Module from '@library/module';
import authHandler from '@handlers/auth';
import getUserHistoriesController from './getUserHistories.controller';
import { SchemaType } from '@library/constant';
import userSchema from '@schemas/user';
import pageSchema from '@schemas/page';
import postUserHistoriesController from './postUserHistories.controller';
import userHistorySchema from '@schemas/userHistory';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [authHandler, getUserHistoriesController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userHandle: userSchema['handle']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: pageSchema
		}
	}
}, {
	method: 'POST',
	path: '',
	handlers: [authHandler, postUserHistoriesController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userHandle: userSchema['handle']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				episodeId: userHistorySchema['episodeId'],
				time: userHistorySchema['time']
			}
		}
	}
}], ':userHandle/histories');