import { Schema } from '@library/schema';
import { Media } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const mediaSchema: Schema<keyof Media> = new Schema<keyof Media>({
	id: commonSchema.get('positiveInteger'),
	hash: commonSchema.get('sha512Hex'),
	userId: userSchema.get('id'),
	type: schema.string().minLength(3).maxLength(3),
	size: commonSchema.get('positiveInteger'),
	width: schema.integer().minimum(1),
	height: schema.integer().minimum(1),
	aspectRatio: schema.string().pattern(/^[1-9][0-9]*:[1-9][0-9]*$/),
	duration: commonSchema.get('positiveInteger'),
	frameRate: commonSchema.get('positiveInteger'),
	bitRate: commonSchema.get('positiveInteger'),
	channelCount: commonSchema.get('positiveInteger'),
	isDeleted: schema.boolean(),
	isVideo: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default mediaSchema;