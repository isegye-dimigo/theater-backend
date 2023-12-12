import { Schema, UserHistory } from '@library/type';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import episodeSchema from '@schemas/episode';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	episodeId: episodeSchema['id'],
	time: commonSchema['index'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof UserHistory, Schema>;