import { Schema } from '@library/type';
import { Series } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import mediaSchema from '@schemas/media';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	mediaId: mediaSchema['id'],
	title: commonSchema['title'],
	description: commonSchema['description'],
	createdAt: commonSchema['datetime']
} satisfies Schema<Series>;