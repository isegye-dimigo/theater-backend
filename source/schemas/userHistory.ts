import { Schema } from '@library/type';
import { UserHistory } from '@prisma/client';
import commonSchema from '@schemas/common';
import mediaVideoSchema from '@schemas/mediaVideo';

export default {
	id: commonSchema['positiveInteger'],
	userId: commonSchema['positiveInteger'],
	movieId: commonSchema['positiveInteger'],
	duration: mediaVideoSchema['duration'],
	createdAt: commonSchema['datetime']
} satisfies Schema<UserHistory>;