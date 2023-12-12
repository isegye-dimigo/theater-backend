import { kysely, redis } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, Request, Response } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { DeleteResult, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('user_id as userId')
		.where('id', '=', request['parameter']['movieId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'userId'>): Promise<[UpdateResult, DeleteResult]> {
			if(typeof(movie) !== 'undefined') {
				if(request['user']['id'] === movie['userId']) {
					return resolveInSequence<[UpdateResult, DeleteResult]>([transaction.updateTable('movie')
					.set({
						is_deleted: true
					})
					.where('id', '=', request['parameter']['movieId'])
					.executeTakeFirst(), transaction.deleteFrom('movie_statistic')
					.where('movie_id', '=', request['parameter']['movieId'])
					.executeTakeFirst()]);
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (results: [UpdateResult, DeleteResult]): void {
			if(results[0]['numUpdatedRows'] === 1n) {
				response.setStatus(204);
				response.send();

				redis.set('movieIndex:delete:' + request['parameter']['movieId'], 'null')
				.catch(request['server']['logger'].error);
	
				return;
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		});
	});
}