import { Schema } from '@library/type';
import { MediaPart } from '@prisma/client';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	mediaId: commonSchema['positiveInteger'],
	index: commonSchema['positiveInteger'],
	size: commonSchema['positiveInteger'],
	duration: commonSchema['positiveFloat'],
	audioBitRate: commonSchema['positiveInteger'],
	videoBitRate: commonSchema['positiveInteger']
} satisfies Schema<MediaPart>;