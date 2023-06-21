import Module from '@library/module';
import getRootController from './getRoot.controller';
import getRobotsTxtController from './getRobotsTxt.controller';
import wellKnownModule from './.well-known/wellKnown.module';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getRootController
	}, {
		method: 'GET',
		url: 'robots.txt',
		handler: getRobotsTxtController
	}],
	modules: [wellKnownModule],
	prefix: ''
});