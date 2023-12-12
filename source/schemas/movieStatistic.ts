import { MovieStatistic, Schema } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	viewCount: commonSchema['index'],
	commentCount: commonSchema['index'],
	starAverage: {
		type: SchemaType['NUMBER'],
		minimum: 0,
		maximum: Number['MAX_VALUE']
	},
	createdAt: commonSchema['datetime']
} satisfies Record<keyof MovieStatistic, Schema>;