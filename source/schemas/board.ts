import { Schema } from '@library/schema';
import { Board } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const boardSchema: Schema<keyof Board> = new Schema<keyof Board>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	title: schema.string().minLength(1).maxLength(64),
	content: schema.string().minLength(1).maxLength(65535),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default boardSchema;