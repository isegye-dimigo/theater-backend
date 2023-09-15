import Module from '@library/module';
import getEmailController from './getEmail.controller';
import postLoginController from './postLogin.controller';
import postTokenController from './postToken.controller';
import getAuthController from './getAuth.controller';
import userSchema from '@schemas/user';
import commonSchema from '@schemas/common';

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
				email: userSchema.get('email').required(),
				password: userSchema.get('password').required()
			}
		}
	}, {
		method: 'POST',
		url: 'token',
		handler: postTokenController,
		schema: {
			body: {
				refreshToken: commonSchema.get('jsonWebToken').required()
			}
		}
	}],
	modules: [],
	prefix: 'auth'
});