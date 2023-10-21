import Module from '@library/module';
import getEmailController from './getEmail.controller';
import postLoginController from './postLogin.controller';
import postTokenController from './postToken.controller';
import getAuthController from './getAuth.controller';
import userSchema from '@schemas/user';
import commonSchema from '@schemas/common';
import userVerificationSchema from '@schemas/userVerification';

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
				token: userVerificationSchema['token'].required()
			}
		}
	}, {
		method: 'POST',
		url: 'login',
		handler: postLoginController,
		schema: {
			body: {
				email: userSchema['email'].required(),
				password: userSchema['password'].required()
			}
		}
	}, {
		method: 'POST',
		url: 'token',
		handler: postTokenController,
		schema: {
			body: {
				refreshToken: commonSchema['jsonWebToken'].required()
			}
		}
	}],
	modules: [],
	prefix: 'auth'
});