import { Schema } from '@library/schema';
import { MovieLike } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

const movieLikeSchema: Schema<keyof MovieLike> = new Schema<keyof MovieLike>({
	id: commonSchema.get('positiveInteger'),
	movieId: movieSchema.get('id'),
	userId: userSchema.get('id')
});

export default movieLikeSchema;