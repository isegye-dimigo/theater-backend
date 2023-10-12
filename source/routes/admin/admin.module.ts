import Module from '@library/module';
import adminCategoriesModule from './adminCategories/adminCategories.module';
import adminMoviesModule from './adminMovies/adminMovies.module';
import adminReportsModule from './adminReports/adminReports.module';
import adminUsersModule from './adminUsers/adminUsers.module';
import getAdminController from './getAdmin.controller';
import adminHandler from '@handlers/admin';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminController,
		preValidation: adminHandler
	}],
	prefix: 'admin',
	modules: [adminCategoriesModule, adminMoviesModule, adminReportsModule, adminUsersModule]
});