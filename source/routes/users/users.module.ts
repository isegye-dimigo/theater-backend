import Module from '@library/module';
import userSchema from '@schemas/user';
import postUsersController from './postUsers.controller';
import patchUserController from './patchUser.controller';
import getUserController from './getUser.controller';
import deleteUserController from './deleteUser.controller';
import authHandler from '@handlers/auth';
import { SchemaType } from '@library/constant';
import userHistoriesModule from './userHistories/userHistories.module';
import userCommentsModule from './userComments/userComments.module';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [postUsersController],
	schema: {
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				email: userSchema['email'],
				password: userSchema['password'],
				name: userSchema['name']
			}
		}
	}
}, {
	method: 'PATCH',
	path: ':userHandle',
	handlers: [authHandler, patchUserController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userHandle: userSchema['handle']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				email: Object.assign({
					isOptional: true
				} as const, userSchema['email']),
				password: Object.assign({
					isOptional: true
				} as const, userSchema['password']),
				handle: Object.assign({
					isOptional: true
				} as const, userSchema['handle']),
				name: Object.assign({
					isOptional: true
				} as const, userSchema['name']),
				description: Object.assign({
					isOptional: true
				} as const, userSchema['description']),
				profileMediaId: Object.assign({
					isOptional: true
				} as const, userSchema['profileMediaId']),
				bannerMediaId: Object.assign({
					isOptional: true
				} as const, userSchema['bannerMediaId']),
				currentPassword: userSchema['password']
			}
		}
	}
}, {
	method: 'GET',
	path: ':userHandle',
	handlers: [getUserController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userHandle: userSchema['handle']
			}
		},
	}
}, {
	method: 'DELETE',
	path: ':userHandle',
	handlers: [authHandler, deleteUserController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userHandle: userSchema['handle']
			}
		}
	}
}], 'users', [userCommentsModule, userHistoriesModule]);