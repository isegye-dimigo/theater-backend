import Module from '@library/module';
import getCategoriesController from './getCategories.controller';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [getCategoriesController]
}], 'categories');