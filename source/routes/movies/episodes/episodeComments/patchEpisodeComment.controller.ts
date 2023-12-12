import { kysely } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/error';
import { Database, MediaVideo, Movie, EpisodeComment, Episode, Request, Response } from '@library/type';
import { JoinBuilder, SelectQueryBuilder, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
		episodeId: EpisodeComment['episodeId'];
		episodeCommentId: EpisodeComment['id'];
	};
	body: Partial<NoneNullable<Pick<EpisodeComment, 'time' | 'content'>>>;
}>, response: Response): Promise<void> {
	if(Object.keys(request['body'])['length'] !== 0) {
		const isTimeDefined: boolean = typeof(request['body']['time']) === 'number';

		return kysely.transaction()
		.setIsolationLevel('serializable')
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			return transaction.selectFrom('movie')
			.select('movie.id')
			.where('movie.id', '=', request['parameter']['movieId'])
			.where('movie.is_deleted', '=', false)
			.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
				return joinBuilder.onRef('movie.id', '=','episode.movie_id')
				.on('episode.id', '=', request['parameter']['episodeId'])
				.on('episode.is_deleted', '=', false);
			})
			.select('episode.id as episode_id')
			.$if(isTimeDefined, function (queryBuilder: SelectQueryBuilder<Omit<Database, 'episode'> & {
				episode: Nullable<Database['episode']>;
			}, 'movie' | 'episode', Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'>>>): SelectQueryBuilder<Omit<Database, 'episode'> & {
				episode: Nullable<Database['episode']>;
				episode_videoMedia_video: Nullable<Database['media_video']>;
			}, 'movie' | 'episode' | 'media_video' | 'episode_videoMedia_video', Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'> & PrefixPick<MediaVideo, 'episode_videoMedia_video_', 'duration'>>> {
				return queryBuilder.leftJoin('media_video as episode_videoMedia_video', 'episode.video_media_id', 'episode_videoMedia_video.media_id')
				.select('episode_videoMedia_video.duration as episode_videoMedia_video_duration');
			})
			.leftJoin('episode_comment as comment', function (joinBuilder: JoinBuilder<Omit<Database, 'episode'> & {
				episode: Nullable<Database['episode']>;
				comment: Database['episode_comment'];
			}, 'movie' | 'episode' | 'comment'>): JoinBuilder<Omit<Database, 'episode'> & {
				episode: Nullable<Database['episode']>;
				comment: Database['episode_comment'];
			}, 'movie' | 'episode' | 'comment'> {
				return joinBuilder.onRef('episode.id', '=', 'comment.episode_id')
				.on('comment.id', '=', request['parameter']['episodeCommentId'])
				.on('comment.is_deleted', '=', false);
			})
			.select('comment.user_id as comment_userId')
			.executeTakeFirst()
			.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'> & Partial<PrefixPick<MediaVideo, 'episode_videoMedia_video_', 'duration'>> & PrefixPick<EpisodeComment, 'comment_', 'userId'>>): Promise<UpdateResult> {
				if(typeof(movie) !== 'undefined') {
					if(movie['episode_id'] !== null) {
						if(movie['comment_userId'] !== null) {
							if(request['user']['id'] === movie['comment_userId']) {
								if(!isTimeDefined || typeof(movie['episode_videoMedia_video_duration']) === 'number' && request['body']['time'] as number <= movie['episode_videoMedia_video_duration']) {
									return transaction.updateTable('episode_comment')
									.set({
										time: request['body']['time'],
										content: request['body']['content']
									})
									.where('id', '=', request['parameter']['episodeCommentId'])
									.executeTakeFirst();
								} else {
									throw new BadRequest('Body[\'time\'] must be valid');
								}
							} else {
								throw new Unauthorized('User must be same');
							}
						} else {
							throw new NotFound('Parameter[\'episodeCommentId\'] must be valid');
						}
					} else {
						throw new NotFound('Parameter[\'episodeId\'] must be valid');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (result: UpdateResult): void {
				if(result['numUpdatedRows'] === 1n) {
					response.send({
						id: request['parameter']['episodeCommentId'],
						time: request['body']['time'],
						content: request['body']['content']
					} satisfies Pick<EpisodeComment, 'id'> & Partial<Pick<EpisodeComment, 'time' | 'content'>>);
	
					return;
				} else {
					throw new NotFound('Parameter[\'episodeCommentId\'] must be valid');
				}
			});
		});
	} else {
		throw new BadRequest('Body must have more than one key');
	}
}