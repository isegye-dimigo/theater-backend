import Module from '@library/module';
import postUsersController from './postUsers.controller';
import userSchema from '@schemas/user';
import getUsersController from './getUsers.controller';
import pageSchema from '@schemas/page';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getUsersController,
		schema: { querystring: {
			'page[index]': pageSchema.get('page[index]'),
			'page[size]': pageSchema.get('page[size]'),
			'page[order]': pageSchema.get('page[order]')
		} }
	},	{
		method: 'POST',
		url: '',
		handler: postUsersController,
		schema: { body: {
			email: userSchema.get('email').required(),
			password: userSchema.get('password').required(),
			name: userSchema.get('name').required()
		} }
	}],
	modules: [],
	prefix: 'users'
});