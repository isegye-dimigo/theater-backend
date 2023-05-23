import { Schema } from '@library/schema';
import { BoardMedia } from '@prisma/client';
import commonSchema from '@schemas/common';
import boardSchema from '@schemas/board';
import mediaSchema from '@schemas/media';

const boardMediaSchema: Schema<keyof BoardMedia> = new Schema<keyof BoardMedia>({
	id: commonSchema.get('id'),
	boardId: boardSchema.get('id'),
	mediaId: mediaSchema.get('id')
});

export default boardMediaSchema;