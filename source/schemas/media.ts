import { Media, Schema } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	hash: commonSchema['sha512Hex'],
	userId: userSchema['id'],
	type: {
		type: SchemaType['STRING'],
		minimum: 3,
		maximum: 3
	},
	size: commonSchema['positiveInteger'],
	width: commonSchema['positiveInteger'],
	height: commonSchema['positiveInteger'],
	aspectRatio: {
		type: SchemaType['STRING'],
		pattern: /^[1-9][0-9]*:[1-9][0-9]*$/
	},
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof Media, Schema>;