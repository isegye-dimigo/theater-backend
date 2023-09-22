import Module from '@library/module';
import getAdminUsersController from './getAdminUsers.controller';
import patchAdminUserController from './patchAdminUser.controller';
import deleteAdminUserController from './deleteAdminUser.controller';
import adminHandler from '@handlers/admin';
import userSchema from '@schemas/user';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminUsersController,
		preValidation: adminHandler
	}, {
		method: 'PATCH',
		url: ':userId',
		handler: patchAdminUserController,
		preValidation: adminHandler,
		schema: {
			params: {
				userId: userSchema.get('id').required()
			},
			body: {
				isVerified: userSchema.get('isVerified').required()
			}
		}
	}, {
		method: 'DELETE',
		url: ':userId',
		handler: deleteAdminUserController,
		preValidation: adminHandler,
		schema: {
			params: {
				userId: userSchema.get('id').required()
			}
		}
	}],
	prefix: 'users',
	modules: []
});