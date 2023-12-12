import { MovieComment, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import movieSchema from '@schemas/movie';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	userId: userSchema['id'],
	content: commonSchema['title'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof MovieComment, Schema>;