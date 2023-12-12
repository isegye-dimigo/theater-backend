import Module from '@library/module';
import adminHandler from '@handlers/admin';
import deleteAdminMovieController from './deleteAdminMovie.controller';
import adminEpisodesModule from './adminEpisodes/adminEpisodes.module';
import adminMovieCommentsModule from './adminMovieComments/adminMovieComments.module';
import { SchemaType } from '@library/constant';
import movieSchema from '@schemas/movie';

export default new Module([{
	method: 'DELETE',
	path: ':movieId',
	handlers: [adminHandler, deleteAdminMovieController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieSchema['id']
			}
		}
	}
}], 'movies', [adminEpisodesModule, adminMovieCommentsModule]);