import { Schema } from '@library/schema';
import { Report } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const reportSchema: Schema<keyof Report> = new Schema<keyof Report>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	type: schema.integer().minimum(0),
	targetId: commonSchema.get('positiveInteger'),
	createdAt: commonSchema.get('datetime')
});

export default reportSchema;