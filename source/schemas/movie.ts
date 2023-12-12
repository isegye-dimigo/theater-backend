import { Movie, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import mediaSchema from '@schemas/media';
import categorySchema from '@schemas/category';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	title: commonSchema['title'],
	description: commonSchema['description'],
	mediaId: mediaSchema['id'],
	categoryId: categorySchema['id'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof Movie, Schema>;