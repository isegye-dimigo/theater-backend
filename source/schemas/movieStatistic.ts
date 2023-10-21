import { Schema } from '@library/type';
import { MovieStatistic } from '@prisma/client';
import commonSchema from '@schemas/common';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	viewCount: commonSchema['positiveInteger'],
	commentCount: commonSchema['positiveInteger'],
	likeCount: commonSchema['positiveInteger'],
	starAverage: commonSchema['default'].number().minimum(0).maximum(10),
	createdAt: commonSchema['datetime']
} satisfies Schema<MovieStatistic>;