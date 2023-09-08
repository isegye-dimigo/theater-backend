import { Schema } from '@library/schema';
import { UserHistory } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';

const userHistorySchema: Schema<keyof UserHistory> = new Schema<keyof UserHistory>({
	id: commonSchema.get('positiveInteger'),
	userId: commonSchema.get('positiveInteger'),
	movieId: commonSchema.get('positiveInteger'),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default userHistorySchema;