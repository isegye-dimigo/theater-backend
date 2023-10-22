import { Schema } from '@library/type';
import { User } from '@prisma/client';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	email: commonSchema['email'],
	password: commonSchema['default'].string().minLength(1),
	handle: commonSchema['default'].string().pattern(/^[A-Za-z0-9-_.]{3,30}$/),
	name: commonSchema['default'].string().minLength(1).maxLength(64),
	description: commonSchema['default'].oneOf([commonSchema['default'].string().minLength(1).maxLength(2048), commonSchema['null']]),
	profileMediaId: commonSchema['default'].oneOf([commonSchema['positiveInteger'], commonSchema['null']]),
	bannerMediaId: commonSchema['default'].oneOf([commonSchema['positiveInteger'], commonSchema['null']]),
	isVerified: commonSchema['boolean'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Schema<User>;