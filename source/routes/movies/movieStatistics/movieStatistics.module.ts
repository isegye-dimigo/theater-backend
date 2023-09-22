import Module from '@library/module';
import getMovieStatisticsController from './getMovieStatistics.controller';
import getMovieStatisticController from './getMovieStatistic.controller';
import movieSchema from '@schemas/movie';
import movieStatisticSchema from '@schemas/movieStatistic';
import pageSchema from '@schemas/page';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getMovieStatisticsController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required()
			},
			querystring: {
				'page[index]': pageSchema.get('page[index]'),
				'page[size]': pageSchema.get('page[size]'),
				'page[order]': pageSchema.get('page[order]')
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':movieStatisticId',
		handler: getMovieStatisticController,
		schema: {
			params: {
				movieId: movieSchema.get('id').required(),
				movieStatisticId: movieStatisticSchema.get('id').required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/statistics',
	modules: []
});