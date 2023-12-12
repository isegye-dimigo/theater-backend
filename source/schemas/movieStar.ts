import { MovieStar, Schema } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import movieSchema from '@schemas/movie';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	movieId: movieSchema['id'],
	userId: userSchema['id'],
	value: {
		type: SchemaType['NUMBER'],
		minimum: 0,
		maximum: 10,
		isInteger: true
	},
	createdAt: commonSchema['datetime']
} satisfies Record<keyof MovieStar, Schema>;