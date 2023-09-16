import { Schema } from '@library/schema';
import { MediaVideoMetadata } from '@prisma/client';
import commonSchema from '@schemas/common';

const mediaVideoMetadataSchema: Schema<keyof MediaVideoMetadata> = new Schema<keyof MediaVideoMetadata>({
	id: commonSchema.get('positiveInteger'),
	mediaId: commonSchema.get('positiveInteger'),
	duration: commonSchema.get('positiveFloat'),
	frameRate: commonSchema.get('positiveFloat'),
	bitRate: commonSchema.get('positiveInteger'),
	sampleRate: commonSchema.get('positiveInteger'),
	channelCount: commonSchema.get('positiveInteger')
});

export default mediaVideoMetadataSchema;