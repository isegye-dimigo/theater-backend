import Module from '@library/module';
import adminHandler from '@handlers/admin';
import getAdminReportsController from './getAdminReports.controller';
import deleteAdminReportController from './deleteAdminReport.controller';
import { SchemaType } from '@library/constant';
import pageSchema from '@schemas/page';
import reportSchema from '@schemas/report';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [adminHandler, getAdminReportsController],
	schema: {
		query: {
			type: SchemaType['OBJECT'],
			properties: pageSchema
		}
	}
}, {
	method: 'DELETE',
	path: ':reportId',
	handlers: [adminHandler, deleteAdminReportController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				reportId: reportSchema['id']
			}
		}
	}
}], 'reports');