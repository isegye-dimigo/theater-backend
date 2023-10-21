import Module from '@library/module';
import getUserHistoriesController from './getUserHistories.controller';
import pageSchema from '@schemas/page';
import userSchema from '@schemas/user';
import userHistorySchema from '@schemas/userHistory';
import postUserHistoriesController from './postUserHistories.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postUserHistoriesController,
		schema: {
			params: {
				userHandle: userSchema['handle'].required()
			},
			body: {
				movieId: userHistorySchema['id'].required(),
				duration: userHistorySchema['duration'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getUserHistoriesController,
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
	prefix: ':userHandle/histories',
	modules: []
});