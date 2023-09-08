import Module from '@library/module';
import getEmailController from './getEmail.controller';
import userSchema from '@schemas/user';
import postLoginController from './postLogin.controller';
import postTokenController from './postToken.controller';
import commonSchema from '@schemas/common';
import getAuthController from './getAuth.controller';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAuthController
	}, {
		method: 'GET',
		url: 'email',
		handler: getEmailController,
		schema: {
			querystring: {
				verificationKey: userSchema.get('verificationKey').required()
			}
		}
	}, {
		method: 'POST',
		url: 'login',
		handler: postLoginController,
		schema: {
			body: {
				email: userSchema.get('email'),
				password: userSchema.get('password')
			}
		}
	}, {
		method: 'POST',
		url: 'token',
		handler: postTokenController,
		schema: {
			body: {
				refreshToken: commonSchema.get('jsonWebToken')
			}
		}
	}],
	modules: [],
	prefix: 'auth'
});