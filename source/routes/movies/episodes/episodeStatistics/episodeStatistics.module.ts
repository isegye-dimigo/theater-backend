import authHandler from '@handlers/auth';
import Module from '@library/module';
import getEpisodeStatisticsController from './getEpisodeStatistics.controller';
import { SchemaType } from '@library/constant';
import episodeStatisticSchema from '@schemas/episodeStatistic';
import pageSchema from '@schemas/page';
import episodeSchema from '@schemas/episode';

export default new Module([{
	method: 'GET',
	path: '',
	handlers: [authHandler, getEpisodeStatisticsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeStatisticSchema['episodeId']
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
	handlers: [authHandler, getEpisodeStatisticsController],
	schema: {
		parameter: {
			type: SchemaType['OBJECT'],
			properties: {
				movieId: episodeSchema['movieId'],
				episodeId: episodeStatisticSchema['episodeId'],
				movieStatisticId: episodeStatisticSchema['id']
			}
		}
	}
}], ':episodeId/statistics');