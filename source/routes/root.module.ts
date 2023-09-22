import Module from '@library/module';
import getRootController from './getRoot.controller';
import getRobotsTxtController from './getRobotsTxt.controller';
import postAndGetCoffeeController from './postAndGetCoffee.controller';
import wellKnownModule from './.well-known/wellKnown.module';
import authModule from './auth/auth.module';
import usersModule from './users/users.module';
import mediasModule from './medias/medias.module';
import moviesModule from './movies/movies.module';
import reportsModule from './reports/reports.module';
import adminModule from './admin/admin.module';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getRootController
	}, {
		method: 'GET',
		url: 'robots.txt',
		handler: getRobotsTxtController
	}, {
		method: 'POST',
		url: 'coffee',
		handler: postAndGetCoffeeController,
	}, {
		method: 'GET',
		url: 'coffee',
		handler: postAndGetCoffeeController,
	}],
	modules: [adminModule, wellKnownModule, authModule, mediasModule, moviesModule, reportsModule, usersModule],
	prefix: ''
});