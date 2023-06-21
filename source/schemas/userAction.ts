import { Schema } from '@library/schema';
import { UserAction } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const userActionSchema: Schema<keyof UserAction> = new Schema<keyof UserAction>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	type: schema.integer().minimum(0),
	experiencePoint: schema.integer(),
	targetId: commonSchema.get('positiveInteger'),
	createdAt: commonSchema.get('datetime')
});

export default userActionSchema;