import Module from '@library/module';
import getMoviesController from './getMovies.controller';
import { CATEGORYS, SchemaType } from '@library/constant';
import pageSchema, { pageOrderAscSchema } from '@schemas/page';
import movieSchema from '@schemas/movie';
import authHandler from '@handlers/auth';
import postMoviesController from './postMovies.controller';
import getMovieController from './getMovie.controller';
import deleteMovieController from './deleteMovie.controller';
import patchMovieController from './patchMovie.controller';
import movieCommentsModule from './movieComments/movieComments.module';
import movieStarModule from './movieStar/movieStar.module';
import movieStatisticsModule from './movieStatistics/movieStatistics.module';
import episodesModule from './episodes/episodes.module';

export default new Module([{
	method: 'POST',
	path: '',
	handlers: [authHandler, postMoviesController],
	schema: {
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				title: movieSchema['title'],
				description: movieSchema['description'],
				mediaId: movieSchema['mediaId'],
				categoryId: movieSchema['categoryId']
			}
		}
	}
}, {
	method: 'GET',
	path: '',
	handlers: [getMoviesController],
	schema: {
		query: {
			type: SchemaType['OBJECT'],
			// @ts-expect-error
			properties: Object.assign({
				'page[orderBy]': {
					type: SchemaType['STRING'],
					enum: ['likeCount', 'viewCount', 'starAverage', 'id'],
					isOptional: true,
					default: 'id'
				},
				query: Object.assign({
					isOptional: true
				} as const, movieSchema['title']),
				categoryId: {
					type: SchemaType['NUMBER'],
					enum: Object.keys(CATEGORYS).map(Number),
					isOptional: true
				}
			} as const, pageSchema)
		}
	}
}, {
	method: 'GET',
	path: ':movieId',
	handlers: [getMovieController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieSchema['id']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: Object.assign({}, pageSchema, {
				'page[order]': pageOrderAscSchema
			})
		}
	}
}, {
	method: 'PATCH',
	path: ':movieId',
	handlers: [authHandler, patchMovieController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieSchema['id']
			}
		},
		body: {
			type: SchemaType['OBJECT'],
			properties: {
				title: Object.assign({
					isOptional: true
				} as const, movieSchema['title']),
				description: Object.assign({
					isOptional: true
				} as const, movieSchema['description']),
				mediaId: Object.assign({
					isOptional: true
				} as const, movieSchema['mediaId']),
				categoryId: Object.assign({
					isOptional: true
				} as const, movieSchema['categoryId'])
			}
		}
	}
}, {
	method: 'DELETE',
	path: ':movieId',
	handlers: [authHandler, deleteMovieController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieSchema['id']
			}
		}
	}
}], 'movies', [episodesModule, movieCommentsModule, movieStarModule, movieStatisticsModule]);