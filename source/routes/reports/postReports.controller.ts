import { kysely } from '@library/database';
import { Database, Report, Request, Response } from '@library/type';
import { getTargetTableName } from '@library/utility';
import { Transaction } from 'kysely';

export default function (request: Request<{
	body: Pick<Report, 'type' | 'targetId'>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom(getTargetTableName(request['body']['type']))
		.select('id')
		.where('id', '=', request['body']['targetId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (target?: {
			id: number;
		}): Promise<Pick<Report, 'id' | 'createdAt'>> {
			return transaction.insertInto('report')
			.values({
				user_id: request['user']['id'],
				type: request['body']['type'],
				target_id: request['body']['targetId']
			})
			.returning(['id', 'created_at as createdAt'])
			.executeTakeFirstOrThrow();
		})
		.then(function (report: Pick<Report, 'id' | 'createdAt'>): void {
			response.send({
				id: report['id'],
				type: request['body']['type'],
				targetId: request['body']['targetId'],
				createdAt: report['createdAt']
			} satisfies Pick<Report, 'id' | 'type' | 'targetId' | 'createdAt'>);

			return;
		});
	});
}