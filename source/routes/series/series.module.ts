import Module from '@library/module';
import postSeriesController from './postSeries.controller';
import getSeriesController from './getSeries.controller';
import seriesSchema from '@schemas/series';
import pageSchema from '@schemas/page';
import deleteSeriesController from './deleteSeries.controller';
import seriesMoviesModule from './seriesMovies/seriesMovies.module';
import patchSeriesController from './patchSeries.controller';

export default new Module({
	routers: [{
		method: 'POST',
		url: '',
		handler: postSeriesController,
		schema: {
			body: {
				mediaId: seriesSchema['mediaId'].required(),
				title: seriesSchema['title'].required(),
				description: seriesSchema['description'].required()
			}
		},
		isAuthNeeded: true
	}, {
		method: 'GET',
		url: ':seriesId',
		handler: getSeriesController,
		schema: {
			params: {
				seriesId: seriesSchema['id'].required()
			},
			querystring: {
				'page[index]': pageSchema['page[index]'],
				'page[size]': pageSchema['page[size]'],
				'page[order]': pageSchema['page[order]']
			}
		}
	}, {
		method: 'PATCH',
		url: '',
		handler: patchSeriesController,
		schema: {
			params: {
				seriesId: seriesSchema['id'].required()
			},
			body: {
				mediaId: seriesSchema['mediaId'],
				title: seriesSchema['title'],
				description: seriesSchema['description']
			}
		},
		isAuthNeeded: true
	}, {
		method: 'DELETE',
		url: ':seriesId',
		handler: deleteSeriesController,
		schema: {
			params: {
				seriesId: seriesSchema['id'].required()
			}
		},
		isAuthNeeded: true
	}],
	prefix: 'series',
	modules: [seriesMoviesModule]
});