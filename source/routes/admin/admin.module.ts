import Module from '@library/module';
import adminMoviesModule from './adminMovies/adminMovies.module';
import adminReportsModule from './adminReports/adminReports.module';
import adminUsersModule from './adminUsers/adminUsers.module';
import getAdminController from './getAdmin.controller';
import adminHandler from '@handlers/admin';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [adminHandler, getAdminController],
}], 'admin', [adminMoviesModule, adminReportsModule, adminUsersModule]);