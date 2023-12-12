import { EpisodeStatistic, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import episodeSchema from '@schemas/episode';

export default {
	id: commonSchema['positiveInteger'],
	episodeId: episodeSchema['id'],
	viewCount: commonSchema['index'],
	commentCount: commonSchema['index'],
	likeCount: commonSchema['index'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof EpisodeStatistic, Schema>;