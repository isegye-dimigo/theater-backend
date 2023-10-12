import Module from '@library/module';
import postAdminCategoriesController from './postAdminCategories.controller';
import adminHandler from '@handlers/admin';
import categorySchema from '@schemas/category';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postAdminCategoriesController,
		preValidation: adminHandler,
		schema: {
			body: {
				title: categorySchema.get('title').required()
			}
		}
	}],
	prefix: 'categories',
	modules: []
});