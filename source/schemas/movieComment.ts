import { Schema } from '@library/type';
import { MovieComment } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	userId: userSchema['id'],
	time: commonSchema['default'].number().minimum(0),
	content: commonSchema['default'].string().minLength(1).maxLength(128),
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Schema<MovieComment>;