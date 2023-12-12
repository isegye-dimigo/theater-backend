import Module from '@library/module';
import postMediasController from './postMedias.controller';
import getMediasController from './getMedias.controller';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [postMediasController] // Do not need auth handler
}, {
	method: 'GET',
	path: '',
	handlers: [getMediasController]
}], 'medias');