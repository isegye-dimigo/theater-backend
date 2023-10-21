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
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]'],
				title: categorySchema['title']
			}
		}
	}],
	prefix: 'categories',
	modules: []
});