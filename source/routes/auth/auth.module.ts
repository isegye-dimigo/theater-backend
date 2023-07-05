import Module from '@library/module';
import getEmailController from './getEmail.controller';
import userSchema from '@schemas/user';

export default new Module({
	routers: [{
		method: 'GET',
		url: 'email',
		handler: getEmailController,
		schema: { querystring: { verificationKey: userSchema.get('verificationKey').required() } }
	}],
	modules: [],
	prefix: 'auth'
});