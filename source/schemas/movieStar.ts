import { Schema } from '@library/type';
import { MovieStar } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	userId: userSchema['id'],
	value: commonSchema['default'].integer().minimum(0).maximum(10),
	createdAt: commonSchema['datetime']
} satisfies Schema<MovieStar>;