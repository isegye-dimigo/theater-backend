import { Schema } from '@library/schema';
import { UserHistory } from '@prisma/client';
import commonSchema from '@schemas/common';

const userHistorySchema: Schema<keyof UserHistory> = new Schema<keyof UserHistory>({
	id: commonSchema.get('positiveInteger'),
	userId: commonSchema.get('positiveInteger'),
	movieId: commonSchema.get('positiveInteger'),
	createdAt: commonSchema.get('datetime')
});

export default userHistorySchema;