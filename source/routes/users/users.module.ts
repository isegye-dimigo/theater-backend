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
				email: userSchema['email'].required(),
				password: userSchema['password'].required(),
				name: userSchema['name'].required()
			}
		}
	}, {
		method: 'PATCH',
		url: ':userHandle',
		handler: patchUserController,
		schema: {
			params: {
				userHandle: userSchema['handle'].required()
			},
			body: {
				email: userSchema['email'],
				password: userSchema['password'],
				handle: userSchema['handle'],
				name: userSchema['name'],
				description: userSchema['description'],
				profileMediaId: userSchema['profileMediaId'],
				bannerMediaId: userSchema['bannerMediaId'],
				currentPassword: userSchema['password'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':userHandle',
		handler: getUserController,
		schema: {
			params: {
				userHandle: userSchema['handle'].required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':userHandle',
		handler: deleteUserController,
		schema: {
			params: {
				userHandle: userSchema['handle'].required()
			}
		},
		isAuthNeeded: true
	}],
	modules: [userCommentsModule, userHistoriesModule],
	prefix: 'users'
});