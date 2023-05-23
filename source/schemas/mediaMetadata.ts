import { Schema } from '@library/schema';
import { MediaMetadata } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import mediaSchema from '@schemas/media';

const mediaMetadataSchema: Schema<keyof MediaMetadata> = new Schema<keyof MediaMetadata>({
	id: commonSchema.get('id'),
	mediaId: mediaSchema.get('id'),
	length: schema.integer().minimum(1),
	videoBitRate: schema.integer().minimum(1),
	videoFrameRate: schema.integer().minimum(1),
	audioBitRate: schema.integer().minimum(1),
	audioSampleRate: schema.integer().minimum(1)
});

export default mediaMetadataSchema;