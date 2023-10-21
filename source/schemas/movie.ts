import { Schema } from '@library/type';
import { Movie } from '@prisma/client';
import commonSchema from '@schemas/common';
import mediaSchema from '@schemas/media';
import userSchema from '@schemas/user';
import categorySchema from '@schemas/category';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	title: commonSchema['title'],
	description: commonSchema['description'],
	videoMediaId: mediaSchema['id'],
	imageMediaId: mediaSchema['id'],
	categoryId: categorySchema['id'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Schema<Movie>;