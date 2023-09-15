import { Schema } from '@library/schema';
import { MovieComment } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import movieSchema from '@schemas/movie';

const movieCommentSchema: Schema<keyof MovieComment> = new Schema<keyof MovieComment>({
	id: commonSchema.get('positiveInteger'),
	movieId: movieSchema.get('id'),
	userId: userSchema.get('id'),
	time: schema.integer().minimum(0),
	content: schema.string().minLength(1).maxLength(128),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default movieCommentSchema;