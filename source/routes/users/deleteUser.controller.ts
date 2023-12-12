import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Request, Response, User } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { DeleteResult, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		userHandle: User['handle'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('user')
		.select('id')
		.where('handle', '=', request['parameter']['userHandle'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (user?: Pick<User, 'id'>) {
			if(typeof(user) !== 'undefined') {
				if(request['user']['id'] === user['id']) {
					return resolveInSequence<[UpdateResult, UpdateResult, UpdateResult, UpdateResult, DeleteResult, DeleteResult, DeleteResult, DeleteResult]>([transaction.updateTable('user')
					.set({
						is_deleted: true,
						banner_media_id: null,
						profile_media_id: null
					})
					.where('id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.updateTable('movie')
					.set({
						is_deleted: true
					})
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.updateTable('movie_comment')
					.set({
						is_deleted: true
					})
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.updateTable('report')
					.set({
						is_deleted: true
					})
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.deleteFrom('episode_like')
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.deleteFrom('movie_star')
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.deleteFrom('movie_statistic')
					.innerJoin('movie', 'movie_statistic.movie_id', 'movie.id')
					.where('movie.user_id', '=', request['user']['id'])
					.executeTakeFirst(), transaction.deleteFrom('user_history')
					.where('user_id', '=', request['user']['id'])
					.executeTakeFirst()])
					.then(function (results: [UpdateResult, UpdateResult, UpdateResult, UpdateResult, DeleteResult, DeleteResult, DeleteResult, DeleteResult]): void {
						if(results[0]['numUpdatedRows'] === 1n) {
							response.setStatus(204);
							response.send();

							return;
						} else {
							throw new NotFound('Parameter[\'userHandle\'] must be valid');
						}
					});
				} else {
					throw new Unauthorized('User must be same');
				}
			} else {
				throw new NotFound('Parameter[\'userHandle\'] must be valid');
			}
		})
	});
}