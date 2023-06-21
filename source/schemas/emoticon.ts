import { Schema } from '@library/schema';
import { Emoticon } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';

const emoticonSchema: Schema<keyof Emoticon> = new Schema<keyof Emoticon>({
	id: commonSchema.get('positiveInteger'),
	userId: userSchema.get('id'),
	name: schema.string().minLength(1).maxLength(64),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default emoticonSchema;