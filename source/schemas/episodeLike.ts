import { EpisodeLike, Schema } from '@library/type';
import commonSchema from '@schemas/common';
import episodeSchema from '@schemas/episode';
import userSchema from '@schemas/user';

export default {
	id: commonSchema['positiveInteger'],
	episodeId: episodeSchema['id'],
	userId: userSchema['id'],
	createdAt: commonSchema['datetime']
} satisfies Record<keyof EpisodeLike, Schema>;