import { Schema } from '@library/schema';
import { BoardComment } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import boardSchema from '@schemas/board';

const boardCommentSchema: Schema<keyof BoardComment> = new Schema<keyof BoardComment>({
	id: commonSchema.get('positiveInteger'),
	boardId: boardSchema.get('id'),
	userId: userSchema.get('id'),
	content: schema.string().minLength(1).maxLength(512),
	isEmoticon: schema.boolean(),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default boardCommentSchema;