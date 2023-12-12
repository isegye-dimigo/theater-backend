import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, EpisodeComment, Request, Response, Episode } from '@library/type';
import { JoinBuilder, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
		episodeId: EpisodeComment['episodeId'];
		episodeCommentId: EpisodeComment['id'];
	};
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
		.leftJoin('episode_comment as comment', function (joinBuilder: JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
			comment: Database['episode_comment'];
		}, 'episode' | 'comment'>): JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
			comment: Database['episode_comment'];
		}, 'episode' | 'comment'> {
			return joinBuilder.onRef('episode.id', '=', 'comment.episode_id')
			.on('comment.id', '=', request['parameter']['episodeCommentId'])
			.on('comment.is_deleted', '=', false);
		})
		.select('comment.id as comment_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'>> & Nullable<PrefixPick<EpisodeComment, 'comment_', 'id'>>): Promise<UpdateResult> {
			if(typeof(movie) !== 'undefined') {
				if(movie['episode_id'] !== null) {
					if(movie['comment_id'] !== null) {
						return transaction.updateTable('episode_comment')
						.set({
							is_deleted: true
						})
						.where('id', '=', request['parameter']['episodeCommentId'])
						.executeTakeFirst();
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
				response.setStatus(204);
				response.send();

				return;
			} else {
				throw new NotFound('Parameter[\'episodeCommentId\'] must be valid');
			}
		});
	});
}