import { Schema } from '@library/type';
import { MovieLike } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	userId: userSchema['id'],
	createdAt: commonSchema['datetime']
} satisfies Schema<MovieLike>;