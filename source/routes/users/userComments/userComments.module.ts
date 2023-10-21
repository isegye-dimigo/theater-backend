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
				userHandle: userSchema['handle'].required()
			},
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]']
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':userHandle/comments',
	modules: []
});