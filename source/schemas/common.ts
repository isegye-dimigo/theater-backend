import { Schema } from '@library/type';
import { SchemaType } from '@library/constant';

export default {
	positiveInteger: {
		type: SchemaType['NUMBER'],
		isInteger: true,
		minimum: 1,
		maximum: Number['MAX_VALUE']
	},
	positiveFloat: {
		type: SchemaType['NUMBER'],
		minimum: 1,
		maximum: Number['MAX_VALUE']
	},
	index: {
		type: SchemaType['NUMBER'],
		isInteger: true,
		minimum: 0,
		maximum: Number['MAX_VALUE']
	},
	sha512Hex: {
		type: SchemaType['STRING'],
		pattern: /^[0-9a-f]{128}$/
	},
	datetime: {
		type: SchemaType['STRING'],
		pattern: /^\d+-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])[Tt]([01]\d|2[0-3]):[0-5]\d:([0-5]\d|60)(\.\d+)?([Zz]|[\|-]([01]\d|2[0-3]):[0-5]\d)$/
	},
	jsonWebToken: {
		type: SchemaType['STRING'],
		pattern: /^[A-Za-z0-9_-]{2,}(\.[A-Za-z0-9-_]{2,}){2}$/
	},
	title: {
		type: SchemaType['STRING'],
		minimum: 1,
		maximum: 128
	},
	description: {
		type: SchemaType['OR'],
		schemas: [{
			type: SchemaType['STRING'],
			minimum: 1,
			maximum: 4096
		}, {
			type: SchemaType['NULL']
		}]
	},
	email: {
		type: SchemaType['STRING'],
		pattern: /^[\w--/!#-&’*=?^`{-~.]+@[a-zA-Z\d-]+(\.[a-zA-Z\d-]{2,})+$/
	},
	boolean: {
		type: SchemaType['BOOLEAN']
	},
	null: {
		type: SchemaType['NULL']
	}
} satisfies Record<'positiveInteger' | 'positiveFloat' | 'index' | 'sha512Hex' | 'datetime' | 'jsonWebToken' | 'title' | 'description' | 'email' | 'boolean' | 'null', Schema>;