import { Schema } from '@library/schema';
import { BoardLike } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import boardSchema from '@schemas/board';

const boardLikeSchema: Schema<keyof BoardLike> = new Schema<keyof BoardLike>({
	id: commonSchema.get('positiveInteger'),
	boardId: boardSchema.get('id'),
	userId: userSchema.get('id')
});

export default boardLikeSchema;