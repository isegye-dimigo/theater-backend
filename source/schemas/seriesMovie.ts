import { Schema } from '@library/type';
import { SeriesMovie } from '@prisma/client';
import commonSchema from '@schemas/common';
import seriesSchema from '@schemas/series';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	seriesId: seriesSchema['id'],
	movieId: movieSchema['id'],
	subtitle: commonSchema['title']
} satisfies Schema<SeriesMovie>;