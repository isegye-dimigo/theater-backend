import authHandler from '@handlers/auth';
import Module from '@library/module';
import postReportsController from './postReports.controller';
import { SchemaType } from '@library/constant';
import reportSchema from '@schemas/report';
import getReportsController from './getReports.controller';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postReportsController],
	schema: {
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				type: reportSchema['type'],
				targetId: reportSchema['targetId']
			}
		}
	}
}, {
	method: 'GET',
	path: '',
	handlers: [getReportsController]
}], 'reports');