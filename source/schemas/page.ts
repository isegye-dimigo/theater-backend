import { PageQuery, Schema } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';

export default {
	'page[index]': Object.assign({
		isOptional: true,
		default: 0
	} as const, commonSchema['index']),
	'page[size]': Object.assign({
		isOptional: true,
		default: 50
	} as const, commonSchema['positiveInteger']),
	'page[order]': {
		type: SchemaType['STRING'],
		enum: ['asc', 'desc'],
		isOptional: true,
		default: 'desc'
	}
} satisfies Record<keyof PageQuery, Schema>;

export const pageOrderAscSchema: Schema = {
	type: SchemaType['STRING'],
	enum: ['asc', 'desc'],
	isOptional: true,
	default: 'asc'
};