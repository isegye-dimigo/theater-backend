import { kysely } from '@library/database';
import { BadRequest, NotFound } from '@library/error';
import { Database, MediaVideo, Movie, EpisodeComment, Episode, Request, Response, User } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
		episodeId: EpisodeComment['episodeId'];
	};
	body: NoneNullable<Pick<EpisodeComment, 'time' | 'content'>>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.id')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
			return joinBuilder.onRef('movie.id', '=', 'episode.movie_id')
			.on('episode.id', '=', request['parameter']['episodeId'])
			.on('episode.is_deleted', '=', false);
		})
		.select('episode.id as episode_id')
		.leftJoin('media_video as episode_videoMedia_video', 'episode.video_media_id', 'episode_videoMedia_video.media_id')
		.select('episode_videoMedia_video.duration as episode_videoMedia_video_duration')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'> & PrefixPick<MediaVideo, 'episode_videoMedia_video_', 'duration'>>): Promise<[Pick<EpisodeComment, 'id' | 'createdAt'>, Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>]> {
			if(typeof(movie) !== 'undefined') {
				if(movie['episode_id'] !== null) {
					if(movie['episode_videoMedia_video_duration'] !== null && request['body']['time'] <= movie['episode_videoMedia_video_duration']) {
						return resolveInSequence<[Pick<EpisodeComment, 'id' | 'createdAt'>, Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>]>([transaction.insertInto('episode_comment')
						.values({
							episode_id: request['parameter']['episodeId'],
							user_id: request['user']['id'],
							time: request['body']['time'],
							content: request['body']['content']
						})
						.returning(['id', 'created_at as createdAt'])
						.executeTakeFirstOrThrow(), transaction.selectFrom('user')
						.select(['id', 'handle', 'name', 'is_verified as isVerified'])
						.where('id', '=', request['user']['id'])
						.executeTakeFirstOrThrow()]);
					} else {
						throw new BadRequest('Body[\'time\'] must be valid');
					}
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (commentAndUser: [Pick<EpisodeComment, 'id' | 'createdAt'>, Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>]): void {
			response.send({
				id: commentAndUser[0]['id'],
				time: request['body']['time'],
				content: request['body']['content'],
				createdAt: commentAndUser[0]['createdAt'],
				user: commentAndUser[1]
			} satisfies Pick<EpisodeComment, 'id' | 'time' | 'content' | 'createdAt'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
			});

			return;
		});
	});
}