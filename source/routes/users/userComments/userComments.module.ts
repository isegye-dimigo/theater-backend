import Module from '@library/module';
import authHandler from '@handlers/auth';
import getUserCommentsController from './getUserComments.controller';
import { SchemaType } from '@library/constant';
import userSchema from '@schemas/user';
import pageSchema from '@schemas/page';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [authHandler, getUserCommentsController],
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
}], ':userHandle/comments');