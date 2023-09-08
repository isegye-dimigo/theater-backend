import Module from '@library/module';
import postUsersController from './postUsers.controller';
import deleteUserController from './deleteUser.controller';
import userSchema from '@schemas/user';
import getUserController from './getUser.controller';
import userCommentsModule from './userComments/userComments.module';
import userHistoriesModule from './userHistories/userHistories.module';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postUsersController,
		schema: {
			body: {
				email: userSchema.get('email').required(),
				password: userSchema.get('password').required(),
				name: userSchema.get('name').required()
			}
		}
	}, {
		method: 'GET',
		url: ':userHandle',
		handler: getUserController,
		schema: {
			params: {
				userHandle: userSchema.get('handle').required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':userHandle',
		handler: deleteUserController,
		schema: {
			params: {
				userHandle: userSchema.get('handle').required()
			}
		},
		isAuthNeeded: true
	}],
	modules: [userCommentsModule, userHistoriesModule],
	prefix: 'users'
});