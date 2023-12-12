import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, Episode, Request, Response } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { JoinBuilder, Transaction, UpdateResult, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
		episodeId: Episode['id'];
	};
}>, response: Response): Promise<void> {
	if(request['user']['isVerified']) {
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
			.select(['episode.index as episode_index'])
			.executeTakeFirst()
			.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<Episode, 'episode_', 'index'>>): Promise<[UpdateResult, UpdateResult]> {
				if(typeof(movie) !== 'undefined') {
					if(movie['episode_index'] !== null) {
						return resolveInSequence<[UpdateResult, UpdateResult]>([transaction.updateTable('episode')
						.set({
							is_deleted: true
						})
						.where('id', '=', request['parameter']['episodeId'])
						.executeTakeFirst(), transaction.updateTable('episode')
						.set({
							index: sql`\`index\` - 1`
						})
						.where('movie_id', '=', request['parameter']['movieId'])
						.where('is_deleted', '=', false)
						.where('index', '>', movie['episode_index'])
						.executeTakeFirst()]);
					} else {
						throw new NotFound('Parameter[\'episodeId\'] must be valid');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (results: [UpdateResult, UpdateResult]): void {
				if(results[0]['numUpdatedRows'] === 1n) {
					response.setStatus(204);
					response.send();

					return;
				} else {
					throw new NotFound('Parameter[\'episodeId\'] must be valid');
				}
			});
		});
	} else {
		throw new Unauthorized('User must be verified');
	}
}