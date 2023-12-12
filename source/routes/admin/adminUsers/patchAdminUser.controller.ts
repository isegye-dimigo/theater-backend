import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Request, Response, User } from '@library/type';
import { Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		userId: User['id'];
	};
	body: Pick<User, 'isVerified'>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('user')
		.select('id')
		.where('id', '=', request['parameter']['userId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (user?: Pick<User, 'id'>): Promise<UpdateResult> {
			if(typeof(user) !== 'undefined') {
				return transaction.updateTable('user')
				.set({
					is_deleted: request['body']['isVerified']
				})
				.executeTakeFirst();
			} else {
				throw new NotFound('Parameter[\'userId\'] must be valid');
			}
		})
		.then(function (result: UpdateResult): void {
			if(result['numUpdatedRows'] === 1n) {
				response.send({
					id: request['parameter']['userId'],
					isVerified: request['body']['isVerified']
				} satisfies Pick<User, 'id' | 'isVerified'>);

				return;
			} else {
				throw new NotFound('Parameter[\'userId\'] must be valid');
			}
		});
	});
}