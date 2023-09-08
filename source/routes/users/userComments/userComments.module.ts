import Module from '@library/module';
import getUserCommentsController from './getUserComments.controller';
import pageSchema from '@schemas/page';
import userSchema from '@schemas/user';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getUserCommentsController,
		schema: {
			params: {
				userHandle: userSchema.get('handle').required()
			},
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]')
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':userHandle/comments',
	modules: []
});