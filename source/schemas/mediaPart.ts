import { MediaPart, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import mediaSchema from '@schemas/media';

export default {
	id: commonSchema['positiveInteger'],
	mediaId: mediaSchema['id'],
	index: commonSchema['positiveInteger'],
	size: commonSchema['positiveInteger'],
	duration: commonSchema['positiveFloat'],
	audioBitRate: commonSchema['positiveInteger'],
	videoBitRate: commonSchema['positiveInteger']
} satisfies Record<keyof MediaPart, Schema>;