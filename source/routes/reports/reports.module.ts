import Module from '@library/module';
import postReportsController from './postReports.controller';
import reportSchema from '@schemas/report';
import getReportsController from './getReports.controller';
import pageSchema from '@schemas/page';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postReportsController,
		schema: {
			body: {
				type: reportSchema.get('type').required(),
				targetId: reportSchema.get('targetId').required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getReportsController,
		schema: {
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]')
			}
		}
	}],
	prefix: 'reports',
	modules: []
});