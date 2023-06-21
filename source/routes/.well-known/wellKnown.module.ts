import Module from '@library/module';
import getSecurityTxtController from './getSecurityTxt.controller';

export default new Module({
	routers: [{
		method: 'GET',
		url: 'security.txt',
		handler: getSecurityTxtController
	}],
	modules: [],
	prefix: '.well-known'
});