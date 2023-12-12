import { Episode, Schema } from '@library/type';
import commonSchema from './common';
import userSchema from './user';
import movieSchema from './movie';
import mediaSchema from './media';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	movieId: movieSchema['id'],
	index: commonSchema['index'],
	title: commonSchema['title'],
	description: commonSchema['description'],
	imageMediaId: mediaSchema['id'],
	videoMediaId: mediaSchema['id'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof Episode, Schema>;