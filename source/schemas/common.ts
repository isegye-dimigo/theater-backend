import schema from 'fluent-json-schema';
import { Schema } from '@library/type';

export default {
	positiveInteger: schema.integer().minimum(1).maximum(Number['MAX_VALUE']),
	positiveFloat: schema.number().minimum(1).maximum(Number['MAX_VALUE']),
	sha512Hex: schema.string().pattern(/^[0-9a-f]{128}$/),
	datetime: schema.string().format('date-time'),
	jsonWebToken: schema.string().pattern(/^[A-Za-z0-9_-]{2,}(\.[A-Za-z0-9-_]{2,}){2}$/),
	title: schema.string().minLength(1).maxLength(128),
	description: schema.oneOf([schema.string().minLength(1).maxLength(4096), schema.null()]),
	email: schema.string().format('email'),
	boolean: schema.boolean(),
	null: schema.null(),
	default: schema
} satisfies Schema<Record<'positiveInteger' | 'positiveFloat' | 'sha512Hex' | 'datetime' | 'jsonWebToken' | 'title' | 'description' | 'email' | 'boolean' | 'null', void>> & {
	default: schema
};