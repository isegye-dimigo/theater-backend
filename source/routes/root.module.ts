import Module from '@library/module';
import getRootController from './getRoot.controller';
import getFaviconIcoController from './getFaviconIco.controller';
import getRobotsTxtController from './getRobotsTxt.controller';
import postAndGetCoffeeController from './postAndGetCoffee.controller';
import wellKnownModule from './.well-known/wellKnown.module';
import adminModule from './admin/admin.module';
import authModule from './auth/auth.module';
import usersModule from './users/users.module';
import moviesModule from './movies/movies.module';
import categoriesModule from './categories/categories.module';
import mediasModule from './medias/medias.module';
import reportsModule from './reports/reports.module';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [getRootController]
}, {
	method: 'GET',
	path: 'favicon.ico',
	handlers: [getFaviconIcoController]
}, {
	method: 'GET',
	path: 'robots.txt',
	handlers: [getRobotsTxtController]
}, {
	method: 'POST',
	path: 'coffee',
	handlers: [postAndGetCoffeeController]
}, {
	method: 'GET',
	path: 'coffee',
	handlers: [postAndGetCoffeeController]
}], '/', [wellKnownModule, adminModule, authModule, categoriesModule, mediasModule, moviesModule, reportsModule, usersModule]);