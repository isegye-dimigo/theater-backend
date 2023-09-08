import { Schema } from '@library/schema';
import { MovieStar } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

const movieStarSchema: Schema<keyof MovieStar> = new Schema<keyof MovieStar>({
	id: commonSchema.get('positiveInteger'),
	movieId: movieSchema.get('id'),
	userId: userSchema.get('id'),
	value: commonSchema['defaultSchema'].integer().minimum(0).maximum(10),
	createdAt: commonSchema.get('datetime')
});

export default movieStarSchema;