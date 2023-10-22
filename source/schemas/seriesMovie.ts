import { Schema } from '@library/type';
import { SeriesMovie } from '@prisma/client';
import commonSchema from '@schemas/common';
import seriesSchema from '@schemas/series';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	seriesId: seriesSchema['id'],
	movieId: movieSchema['id'],
	index: commonSchema['default'].integer().minimum(0),
	subtitle: commonSchema['default'].oneOf([commonSchema['title'], commonSchema['null']])
} satisfies Schema<SeriesMovie>;