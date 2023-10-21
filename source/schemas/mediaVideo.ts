import { Schema } from '@library/type';
import { MediaVideo } from '@prisma/client';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	mediaId: commonSchema['positiveInteger'],
	duration: commonSchema['positiveFloat'],
	frameRate: commonSchema['positiveFloat'],
	bitRate: commonSchema['positiveInteger'],
	sampleRate: commonSchema['positiveInteger'],
	channelCount: commonSchema['positiveInteger']
} satisfies Schema<MediaVideo>;