import { Schema } from '@library/schema';
import { MovieStatistic } from '@prisma/client';
import commonSchema from '@schemas/common';
import movieSchema from '@schemas/movie';

const movieStatisticSchema: Schema<keyof MovieStatistic> = new Schema<keyof MovieStatistic>({
	id: commonSchema.get('positiveInteger'),
	movieId: movieSchema.get('id'),
	viewCount: commonSchema.get('positiveInteger'),
	commentCount: commonSchema.get('positiveInteger'),
	likeCount: commonSchema.get('positiveInteger'),
	starAverage: commonSchema['defaultSchema'].number().minimum(0).maximum(10),
	createdAt: commonSchema.get('datetime')
});

export default movieStatisticSchema;