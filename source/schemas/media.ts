import { Schema } from '@library/schema';
import { Media } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';

const mediaSchema: Schema<keyof Media> = new Schema<keyof Media>({
	id: commonSchema.get('positiveInteger'),
	hash: commonSchema.get('sha512Hex'),
	type: schema.integer().minimum(0),
	size: schema.integer().minimum(0),
	parentMediaId: commonSchema.get('positiveInteger'),
	width: schema.integer().minimum(1),
	height: schema.integer().minimum(1),
	isVideo: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default mediaSchema;