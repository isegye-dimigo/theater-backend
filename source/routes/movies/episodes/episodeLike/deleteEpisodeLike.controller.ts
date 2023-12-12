import { kysely } from '@library/database';
import { Conflict, NotFound } from '@library/error';
import { Database, Movie, Episode, Request, Response, EpisodeLike } from '@library/type';
import { DeleteResult, JoinBuilder, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
		episodeId: EpisodeLike['episodeId'];
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
		.leftJoin('episode_like', function (joinBuilder: JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
		}, 'episode' | 'episode_like'>): JoinBuilder<Omit<Database, 'episode'> & {
			episode: Nullable<Database['episode']>;
		}, 'episode' | 'episode_like'> {
			return joinBuilder.onRef('episode.id', '=', 'episode_like.episode_id')
			.on('episode_like.user_id', '=', request['user']['id']);
		})
		.select('episode_like.id as episode_like_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'id'> & PrefixPick<EpisodeLike, 'episode_like_', 'id'>>): Promise<DeleteResult> {
			if(typeof(movie) !== 'undefined') {
				if(movie['episode_id'] !== null) {
					if(movie['episode_like_id'] !== null) {
						return transaction.deleteFrom('episode_like')
						.where('id', '=', movie['episode_like_id'])
						.executeTakeFirst();
					} else {
						throw new NotFound('User must liked');
					}
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (result: DeleteResult): void {
			if(result['numDeletedRows'] === 1n) {
				response.setStatus(204);
				response.send();
				
				return;
			} else {
				throw new NotFound('User must liked');
			}
		});
	});
}