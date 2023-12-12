import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Request, Response, Movie } from '@library/type';
import { Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Movie['id'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('id')
		.where('id', '=', request['parameter']['movieId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'>): Promise<UpdateResult> {
			if(typeof(movie) !== 'undefined') {
				return transaction.updateTable('movie')
				.set({
					is_deleted: true
				})
				.executeTakeFirst();
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
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		});
	});
}