import { Schema, User } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	email: commonSchema['email'],
	password: {
		type: SchemaType['STRING'],
		minimum: 1
	},
	handle: {
		type: SchemaType['STRING'],
		pattern: /^[A-Za-z0-9-_.]{3,30}$/
	},
	name: {
		type: SchemaType['STRING'],
		minimum: 1,
		maximum: 64
	},
	description: {
		type: SchemaType['OR'],
		schemas: [{
			type: SchemaType['STRING'],
			minimum: 1,
			maximum: 128
		}, commonSchema['null']]
	},
	profileMediaId: {
		type: SchemaType['OR'],
		schemas: [commonSchema['positiveInteger'], commonSchema['null']]
	},
	bannerMediaId: {
		type: SchemaType['OR'],
		schemas: [commonSchema['positiveInteger'], commonSchema['null']]
	},
	isVerified: commonSchema['boolean'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof User, Schema>;