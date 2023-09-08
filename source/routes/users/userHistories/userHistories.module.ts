import Module from '@library/module';
import getUserHistoriesController from './getUserHistories.controller';
import pageSchema from '@schemas/page';
import userSchema from '@schemas/user';
import postUserHistoriesController from './postUserHistories.controller';
import movieSchema from '@schemas/movie';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postUserHistoriesController,
		schema: {
			params: {
				userHandle: userSchema.get('handle').required()
			},
			body: {
				movieId: movieSchema.get('id').required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getUserHistoriesController,
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
	prefix: ':userHandle/histories',
	modules: []
});