import { Schema } from '@library/schema';
import { UserBadge } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const userBadgeSchema: Schema<keyof UserBadge> = new Schema<keyof UserBadge>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	type: schema.integer().minimum(0),
	createdAt: commonSchema.get('datetime')
});

export default userBadgeSchema;