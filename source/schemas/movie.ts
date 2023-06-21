import { Schema } from '@library/schema';
import { Movie } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import mediaSchema from '@schemas/media';
import userSchema from './user';

const movieSchema: Schema<keyof Movie> = new Schema<keyof Movie>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	title: schema.string().minLength(1).maxLength(128),
	description: schema.string().minLength(1).maxLength(4096),
	videoMediaId: mediaSchema.get('id'),
	imageMediaId: mediaSchema.get('id'),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default movieSchema;