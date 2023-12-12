import { Report, Schema } from '@library/type';
import { REPORT_TYPES, SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	type: {
		type: SchemaType['NUMBER'],
		enum: Object.keys(REPORT_TYPES).map(Number)
	},
	targetId: commonSchema['positiveInteger'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof Report, Schema>;