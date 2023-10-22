import Module from '@library/module';
import getMovieStatisticsController from './getMovieStatistics.controller';
import getMovieStatisticController from './getMovieStatistic.controller';
import movieStatisticSchema from '@schemas/movieStatistic';
import pageSchema from '@schemas/page';

export default new Module({
	routers: [{
		method: 'GET',
		url: '',
		handler: getMovieStatisticsController,
		schema: {
			params: {
				movieId: movieStatisticSchema['movieId'].required()
			},
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]']
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':movieStatisticId',
		handler: getMovieStatisticController,
		schema: {
			params: {
				movieId: movieStatisticSchema['movieId'].required(),
				movieStatisticId: movieStatisticSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: ':movieId/statistics',
	modules: []
});