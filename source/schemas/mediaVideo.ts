import { Schema } from '@library/schema';
import { MediaVideo } from '@prisma/client';
import commonSchema from '@schemas/common';

const mediaVideoSchema: Schema<keyof MediaVideo> = new Schema<keyof MediaVideo>({
	id: commonSchema.get('positiveInteger'),
	mediaId: commonSchema.get('positiveInteger'),
	index: commonSchema.get('positiveInteger'),
	size: commonSchema.get('positiveInteger'),
	duration: commonSchema.get('positiveFloat'),
	audioBitRate: commonSchema.get('positiveInteger'),
	videoBitRate: commonSchema.get('positiveInteger')
});

export default mediaVideoSchema;