import Module from '@library/module';
import adminHandler from '@handlers/admin';
import getAdminReportsController from './getAdminReports.controller';
import deleteAdminReportController from './deleteAdminReport.controller';
import pageSchema from '@schemas/page';
import reportSchema from '@schemas/report';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminReportsController,
		preValidation: adminHandler,
		schema: {
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]']
			}
		}
	}, {
		method: 'DELETE',
		url: ':reportId',
		handler: deleteAdminReportController,
		preValidation: adminHandler,
		schema: {
			params: {
				reportId: reportSchema['id'].required()
			}
		}
	}],
	prefix: 'reports',
	modules: []
});