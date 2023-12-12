import authHandler from '@handlers/auth';
import Module from '@library/module';
import getMovieStatisticsController from './getMovieStatistics.controller';
import { SchemaType } from '@library/constant';
import movieStatisticSchema from '@schemas/movieStatistic';
import pageSchema from '@schemas/page';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [authHandler, getMovieStatisticsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieStatisticSchema['movieId']
			}
		},
		query: {
			type: SchemaType['OBJECT'],
			properties: pageSchema
		}
	}
}, {
	method: 'GET',
	path: ':movieStatisticId',
	handlers: [authHandler, getMovieStatisticsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: movieStatisticSchema['movieId'],
				movieStatisticId: movieStatisticSchema['id']
			}
		}
	}
}], ':movieId/statistics');