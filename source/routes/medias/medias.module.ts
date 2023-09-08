import Module from '@library/module';
import postMediaController from './postMedia.controller';
import getMediasController from './getMedias.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postMediaController,
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: '',
		handler: getMediasController
	}],
	modules: [],
	prefix: 'medias'
});