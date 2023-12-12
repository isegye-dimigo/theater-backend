import { kysely, redis } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Media, MediaVideo, Movie, Episode, Request, Response, User, EpisodeStatistic, EpisodeLike } from '@library/type';
import { JoinBuilder, SelectQueryBuilder, Transaction } from 'kysely';
import authHandler from '@handlers/auth';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
		episodeId: Episode['id'];
	};
}>, response: Response): Promise<void> {
		return kysely.transaction()
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			let hasLoggedIn: boolean = true;
		
			try {
				authHandler(request);
			} catch {
				hasLoggedIn = false;
			}

			return transaction.selectFrom('movie')
			.select('movie.id as id')
			.where('movie.id', '=', request['parameter']['movieId'])
			.where('movie.is_deleted', '=', false)
			.leftJoin('episode', function (joinBuilder: JoinBuilder<Database, 'movie' | 'episode'>): JoinBuilder<Database, 'movie' | 'episode'> {
				return joinBuilder.onRef('movie.id', '=', 'episode.movie_id')
				.on('episode.id', '=', request['parameter']['episodeId'])
				.on('episode.is_deleted', '=', false);
			})
			.select('episode.id as episode_id')
			.executeTakeFirst()
			.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'>>): Promise<Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>> & PrefixPick<Media, 'imageMedia_' | 'videoMedia_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'id' | 'duration'> & PrefixPick<EpisodeStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'likeCount'> & Partial<Nullable<PrefixPick<EpisodeLike, 'like_', 'id'>>> | undefined> {
				if(typeof(movie) !== 'undefined') {
					if(movie['episode_id'] !== null) {
						return transaction.selectFrom('episode')
						.select(['episode.id', 'episode.index', 'episode.title', 'episode.description', 'episode.created_at as createdAt'])
						.where('episode.id', '=', request['parameter']['episodeId'])
						.innerJoin('user', 'episode.user_id', 'user.id')
						.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
						.leftJoin('media as user_profileMedia', 'user.profile_media_id', 'user_profileMedia.id')
						.select(['user_profileMedia.id as user_profileMedia_id', 'user_profileMedia.hash as user_profileMedia_hash', 'user_profileMedia.width as user_profileMedia_width', 'user_profileMedia.height as user_profileMedia_height'])
						.innerJoin('media as imageMedia', 'episode.image_media_id', 'imageMedia.id')
						.select(['imageMedia.id as imageMedia_id', 'imageMedia.hash as imageMedia_hash', 'imageMedia.width as imageMedia_width', 'imageMedia.height as imageMedia_height'])
						.innerJoin('media as videoMedia', 'episode.video_media_id', 'videoMedia.id')
						.select(['videoMedia.id as videoMedia_id', 'videoMedia.hash as videoMedia_hash', 'videoMedia.width as videoMedia_width', 'videoMedia.height as videoMedia_height'])
						.innerJoin('media_video as videoMedia_video', 'videoMedia.id', 'videoMedia_video.media_id')
						.select(['videoMedia_video.id as videoMedia_video_id', 'videoMedia_video.duration as videoMedia_video_duration'])
						.innerJoin('episode_statistic as statistic', 'episode.id', 'statistic.episode_id')
						.select(['statistic.id as statistic_id', 'statistic.view_count as statistic_viewCount', 'statistic.comment_count as statistic_commentCount', 'statistic.like_count as statistic_likeCount'])
						.innerJoin('current_episode_statistic as currentStatistic', 'statistic.id', 'currentStatistic.id')
						.$if(hasLoggedIn, function (queryBuilder: SelectQueryBuilder<Database & {
							user_profileMedia: Nullable<Database['media']>;
							imageMedia: Database['media'];
							videoMedia: Database['media'];
							videoMedia_video: Database['media_video'];
							statistic: Database['episode_statistic'];
							currentStatistic: Database['current_episode_statistic'];
						}, 'episode' | 'user' | 'user_profileMedia' | 'imageMedia' | 'videoMedia' | 'videoMedia_video' | 'statistic' | 'currentStatistic', Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>> & PrefixPick<Media, 'imageMedia_' | 'videoMedia_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'id' | 'duration'> & PrefixPick<EpisodeStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'likeCount'>>): SelectQueryBuilder<Database & {
							user_profileMedia: Nullable<Database['media']>;
							imageMedia: Database['media'];
							videoMedia: Database['media'];
							videoMedia_video: Database['media_video'];
							statistic: Database['episode_statistic'];
							currentStatistic: Database['current_episode_statistic'];
							like: Nullable<Database['episode_like']>;
						}, 'episode' | 'user' | 'user_profileMedia' | 'imageMedia' | 'videoMedia' | 'videoMedia_video' | 'statistic' | 'currentStatistic' | 'like', Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>> & PrefixPick<Media, 'imageMedia_' | 'videoMedia_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'id' | 'duration'> & PrefixPick<EpisodeStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'likeCount'> & Nullable<PrefixPick<EpisodeLike, 'like_', 'id'>>> {
							return queryBuilder.leftJoin('episode_like as like', function (joinBuilder: JoinBuilder<Database & {
								user_profileMedia: Nullable<Database['media']>;
								like: Database['episode_like'];
							}, 'episode' | 'user_profileMedia' | 'like'>): JoinBuilder<Database & {
								user_profileMedia: Nullable<Database['media']>;
								like: Database['episode_like'];
							}, 'episode' | 'user_profileMedia' | 'like'> {
								return joinBuilder.onRef('episode.id', '=', 'like.episode_id')
								.on('like.user_id', '=', request['user']['id']);
							})
							.select('like.id as like_id');
						})
						.executeTakeFirst();
					} else {
						throw new NotFound('Parameter[\'episodeId\'] must be valid');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (episode?: Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>> & PrefixPick<Media, 'imageMedia_' | 'videoMedia_', 'id' | 'hash' | 'width' | 'height'> & PrefixPick<MediaVideo, 'videoMedia_video_', 'id' | 'duration'> & PrefixPick<EpisodeStatistic, 'statistic_', 'id' | 'viewCount' | 'commentCount' | 'likeCount'> & Partial<Nullable<PrefixPick<EpisodeLike, 'like_', 'id'>>>): void {
				if(typeof(episode) !== 'undefined') {
					response.send(Object.assign({
						id: episode['id'],
						index: episode['index'],
						title: episode['title'],
						description: episode['description'],
						createdAt: episode['createdAt'],
						user: Object.assign({
							id: episode['user_id'],
							handle: episode['user_handle'],
							name: episode['user_name'],
							isVerified: episode['user_isVerified']
						} as const, episode['user_profileMedia_id'] !== null ? {
							profileMedia: {
								id: episode['user_profileMedia_id'],
								hash: episode['user_profileMedia_hash'] as string,
								width: episode['user_profileMedia_width'] as number,
								height: episode['user_profileMedia_height'] as number
							}
						} : undefined),
						imageMedia: {
							id: episode['imageMedia_id'],
							hash: episode['imageMedia_hash'],
							width: episode['imageMedia_width'],
							height: episode['imageMedia_height']
						},
						videoMedia: {
							id: episode['videoMedia_id'],
							hash: episode['videoMedia_hash'],
							width: episode['videoMedia_width'],
							height: episode['videoMedia_height'],
							video: {
								id: episode['videoMedia_video_id'],
								duration: episode['videoMedia_video_duration']
							}
						},
						statistic: {
							id: episode['statistic_id'],
							viewCount: episode['statistic_viewCount'],
							commentCount: episode['statistic_commentCount'],
							likeCount: episode['statistic_likeCount']
						}
					}, typeof(episode['like_id']) === 'number' ? {
						like: {
							id: episode['like_id']
						}
					} : undefined) satisfies Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & {
						user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
							profileMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
						};
						imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
						videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
							video: Pick<MediaVideo, 'id' | 'duration'>;
						};
						statistic: Pick<EpisodeStatistic, 'id' | 'viewCount' | 'commentCount' | 'likeCount'>;
						like?: Pick<EpisodeLike, 'id'>;
					});

					redis.incr('episodeView:' + request['parameter']['episodeId'])
					.catch(request['server']['logger'].error);

					return;
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			});
		});
}