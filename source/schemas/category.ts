import { Category, Schema } from '@library/type';
import { CATEGORYS, SchemaType } from '@library/constant';

export default {
	id: {
		type: SchemaType['NUMBER'],
		enum: Object.keys(CATEGORYS).map(Number)
	},
	title: {
		type: SchemaType['STRING'],
		minimum: 1,
		maximum: 32
	}
} satisfies Record<keyof Category, Schema>;