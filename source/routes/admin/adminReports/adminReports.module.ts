import Module from '@library/module';
import getAdminReportsController from './getAdminReports.controller';
import adminHandler from '@handlers/admin';
import pageSchema from '@schemas/page';
import deleteAdminReportController from './deleteAdminReport.controller';
import reportSchema from '@schemas/report';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getAdminReportsController,
		preValidation: adminHandler,
		schema: {
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]')
			}
		}
	}, {
		method: 'DELETE',
		url: ':reportId',
		handler: deleteAdminReportController,
		preValidation: adminHandler,
		schema: {
			params: {
				reportId: reportSchema.get('id').required()
			}
		}
	}],
	prefix: 'reports',
	modules: []
});