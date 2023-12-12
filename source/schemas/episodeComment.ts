import { EpisodeComment, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import episodeSchema from '@schemas/episode';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	episodeId: episodeSchema['id'],
	userId: userSchema['id'],
	time: commonSchema['index'],
	content: commonSchema['title'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof EpisodeComment, Schema>;