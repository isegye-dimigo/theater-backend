import { MediaVideo, Schema } from '@library/type';
import { SchemaType } from '@library/constant';
import commonSchema from '@schemas/common';
import mediaSchema from '@schemas/media';

export default {
	id: commonSchema['positiveInteger'],
	mediaId: mediaSchema['id'],
	duration: commonSchema['positiveFloat'],
	frameRate: commonSchema['positiveFloat'],
	bitRate: commonSchema['positiveInteger'],
	sampleRate: commonSchema['positiveInteger'],
	channelCount: {
		type: SchemaType['NUMBER'],
		minimum: 1,
		maximum: 255,
		isInteger: true
	}
} satisfies Record<keyof MediaVideo, Schema>;