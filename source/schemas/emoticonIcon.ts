import { Schema } from '@library/schema';
import { EmoticonIcon } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import emoticonSchema from '@schemas/emoticon';
import mediaSchema from '@schemas/media';

const emoticonIconSchema: Schema<keyof EmoticonIcon> = new Schema<keyof EmoticonIcon>({
	id: commonSchema.get('positiveInteger'),
	emoticonId: emoticonSchema.get('id'),
	index: schema.integer().minimum(0),
	mediaId: mediaSchema.get('id')
});

export default emoticonIconSchema;