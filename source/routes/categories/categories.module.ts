import Module from '@library/module';
import getCategoriesController from './getCategories.controller';
import pageSchema from '@schemas/page';
import categorySchema from '@schemas/category';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getCategoriesController,
		schema: {
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]'),
				title: categorySchema.get('title')
			}
		}
	}],
	prefix: 'categories',
	modules: []
});