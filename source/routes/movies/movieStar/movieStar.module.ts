import authHandler from '@handlers/auth';
import Module from '@library/module';
import postMovieStarController from './postMovieStar.controller';
import deleteMovieStarController from './deleteMovieStar.controller';
import { SchemaType } from '@library/constant';
import movieStar from '@schemas/movieStar';
import patchMovieStarController from './patchMovieStar.controller';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postMovieStarController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieStar['movieId']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				value: movieStar['value']
			}
		}
	}
}, {
	method: 'PATCH',
	path: '',
	handlers: [authHandler, patchMovieStarController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieStar['movieId']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				value: movieStar['value']
			}
		}
	}
}, {
	method: 'DELETE',
	path: '',
	handlers: [authHandler, deleteMovieStarController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieStar['movieId']
			}
		}
	}
}], ':movieId/star');