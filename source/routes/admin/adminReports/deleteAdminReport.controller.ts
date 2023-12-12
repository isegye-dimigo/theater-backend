import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Report, Request, Response } from '@library/type';
import { Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		reportId: Report['id'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('report')
		.select('id')
		.where('id', '=', request['parameter']['reportId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (report?: Pick<Report, 'id'>): Promise<UpdateResult> {
			if(typeof(report) !== 'undefined') {
				return transaction.updateTable('report')
				.set({
					is_deleted: true
				})
				.executeTakeFirst();
			} else {
				throw new NotFound('Parameter[\'reportId\'] must be valid');
			}
		})
		.then(function (result: UpdateResult): void {
			if(result['numUpdatedRows'] === 1n) {
				response.setStatus(204);
				response.send();

				return;
			} else {
				throw new NotFound('Parameter[\'reportId\'] must be valid');
			}
		});
	});
}