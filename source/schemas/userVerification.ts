import { Schema, UserVerification } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	email: commonSchema['email'],
	password: {
		type: SchemaType['STRING'],
		minimum: 1
	},
	name: {
		type: SchemaType['STRING'],
		minimum: 1,
		maximum: 64
	},
	token: {
		type: SchemaType['STRING'],
		pattern: /^[0-9a-f]{40}$/
	},
	createdAt: commonSchema['datetime']
} satisfies Record<keyof UserVerification, Schema>;