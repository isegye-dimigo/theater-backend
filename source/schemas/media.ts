import { Schema } from '@library/type';
import { Media } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	hash: commonSchema['sha512Hex'],
	userId: userSchema['id'],
	type: commonSchema['default'].string().minLength(3).maxLength(3),
	size: commonSchema['positiveInteger'],
	width: commonSchema['default'].integer().minimum(1),
	height: commonSchema['default'].integer().minimum(1),
	aspectRatio: commonSchema['default'].string().pattern(/^[1-9][0-9]*:[1-9][0-9]*$/),
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Schema<Media>;