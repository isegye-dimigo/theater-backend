import { kysely } from '@library/database';
import { InternalServerHttpError } from '@library/error';
import { Database, PageQuery, Report, Request, Response, User } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { Transaction } from 'kysely';

export default function (request: Request<{
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		const reports: (Pick<Report, 'id' | 'type'> & {
			user: Pick<User, 'id' | 'email' | 'handle' | 'name'>;
			target?: unknown;
		})[] = [];

		return transaction.selectFrom('report')
		.select(['report.id', 'report.type', 'report.target_id as targetId'])
		.where('report.is_deleted', '=', false)
		.orderBy('report.id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
		.limit(request['query']['page[size]'])
		.offset(request['query']['page[size]'] * request['query']['page[index]'])
		.innerJoin('user', 'report.user_id', 'user.id')
		.select(['user.id as user_id', 'user.email as user_email', 'user.handle as user_handle', 'user.name as user_name'])
		.execute()
		.then(function (rawReports: (Pick<Report, 'id' | 'type' | 'targetId'> & PrefixPick<User, 'user_', 'id' | 'email' | 'handle' | 'name'>)[]): Promise<unknown[]> {
			const targetPromises: Promise<unknown>[] = [];

			for(let i: number = 0; i < rawReports['length']; i++) {
				switch(rawReports[i]['type']) {
					case 0:
					case 1:
					case 2:
					case 3:
					case 4:
					case 5:
					case 6:
					case 7:
					case 8: {
						targetPromises.push(transaction.selectFrom('user')
						.select(['id', 'email', 'handle', 'name'])
						.where('id', '=', rawReports[i]['targetId'])
						.where('is_deleted', '=', false)
						.executeTakeFirstOrThrow());

						break;
					}
						
					case 10:
					case 11:
					case 12:
					case 13:
					case 14:
					case 15:
					case 16:
					case 17:
					case 20:
					case 21:
					case 22:
					case 23:
					case 24:
					case 25:
					case 26:
					case 27: {
						targetPromises.push(transaction.selectFrom(rawReports[i]['type'] < 20 ? 'movie' : 'episode')
						.select(['id', 'title'])
						.where('id', '=', rawReports[i]['targetId'])
						.where('is_deleted', '=', false)
						.executeTakeFirstOrThrow());

						break;
					}

					case 30:
					case 31:
					case 32:
					case 33:
					case 34:
					case 35:
					case 36:
					case 37:
					case 40:
					case 41:
					case 42:
					case 43:
					case 44:
					case 45:
					case 46:
					case 47: {
						const tablePrefix: 'movie' | 'episode' = rawReports[i]['type'] < 40 ? 'movie' : 'episode';
						
						targetPromises.push(transaction.selectFrom(tablePrefix + '_comment' as 'movie_comment')
						.select(['id', tablePrefix + '_id as ' + tablePrefix + 'Id' as 'movie_id as movieId', 'content'])
						.where('id', '=', rawReports[i]['targetId'])
						.where('is_deleted', '=', false)
						.executeTakeFirstOrThrow());
						
						break;
					}

					default: {
						throw new InternalServerHttpError('Reports[' + i + '][\'type\'] must be valid');
					}
				}

				reports.push({
					id: rawReports[i]['id'],
					type: rawReports[i]['type'],
					user: {
						id: rawReports[i]['user_id'],
						email: rawReports[i]['user_email'],
						handle: rawReports[i]['user_handle'],
						name: rawReports[i]['user_name']
					}
				});
			}

			return resolveInSequence(targetPromises);
		})
		.then(function (targets: unknown[]): void {
			for(let i: number = 0; i < reports['length']; i++) {
				reports[i]['target'] = targets[i];
			}

			response.send(reports);

			return;
		});
	});
}