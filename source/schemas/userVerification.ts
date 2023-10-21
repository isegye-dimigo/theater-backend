import { Schema } from '@library/type';
import { UserVerification } from '@prisma/client';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	email: commonSchema['email'],
	password: commonSchema['default'].string().minLength(1),
	name: commonSchema['default'].string().minLength(1).maxLength(64),
	token: commonSchema['default'].string().pattern(/^[0-9a-f]{40}$/),
	createdAt: commonSchema['datetime']
} satisfies Schema<UserVerification>;