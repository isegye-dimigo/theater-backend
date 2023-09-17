import Module from '@library/module';
import userSchema from '@schemas/user';
import postUsersController from './postUsers.controller';
import patchUserController from './patchUser.controller';
import deleteUserController from './deleteUser.controller';
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
		method: 'PATCH',
		url: ':userHandle',
		handler: patchUserController,
		schema: {
			params: {
				userHandle: userSchema.get('handle').required()
			},
			body: {
				email: userSchema.get('email'),
				password: userSchema.get('password'),
				handle: userSchema.get('handle'),
				name: userSchema.get('name'),
				description: userSchema.get('description'),
				profileMediaId: userSchema.get('profileMediaId'),
				bannerMediaId: userSchema.get('bannerMediaId'),
				currentPassword: userSchema.get('password').required()
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