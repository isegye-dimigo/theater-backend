import Module from '@library/module';
import patchAdminUserController from './patchAdminUser.controller';
import deleteAdminUserController from './deleteAdminUser.controller';
import { SchemaType } from '@library/constant';
import adminHandler from '@handlers/admin';
import userSchema from '@schemas/user';

export default new Module([{
	method: 'PATCH',
	path: ':userId',
	handlers: [adminHandler, patchAdminUserController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userId: userSchema['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				isVerified: userSchema['isVerified']
			}
		}
	}
}, {
	method: 'DELETE',
	path: ':userId',
	handlers: [adminHandler, deleteAdminUserController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				userId: userSchema['id']
			}
		}
	}
}], 'users');