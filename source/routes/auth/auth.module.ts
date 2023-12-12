import Module from '@library/module';
import getEmailController from './getEmail.controller';
import postLoginController from './postLogin.controller';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import userVerificationSchema from '@schemas/userVerification';
import postTokenController from './postToken.controller';

export default new Module([{
	method: 'GET',
	path: 'email',
	handlers: [getEmailController],
	schema: {
		query: {
			type: SchemaType['OBJECT'],
			properties: {
				token: userVerificationSchema['token']
			}
		}
	}
}, {
	method: 'POST',
	path: 'login',
	handlers: [postLoginController],
	schema: {
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				email: commonSchema['email'],
				password: userSchema['password']
			}
		}
	}
}, {
	method: 'POST',
	path: 'token',
	handlers: [postTokenController],
	schema: {
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				refreshToken: commonSchema['jsonWebToken']
			}
		}
	}
}], 'auth');