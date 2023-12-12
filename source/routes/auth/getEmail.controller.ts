import { getUniqueRandomHandle, kysely } from '@library/database';
import { BadRequest } from '@library/error';
import { Database, Request, Response, User, UserVerification } from '@library/type';
import { resolveInSequence } from '@library/utility';
import { DeleteResult, InsertResult, Transaction } from 'kysely';

export default function (request: Request<{
	query: Pick<UserVerification, 'token'>;
}>, response: Response): Promise<void> {
	return kysely.selectFrom('user_verification')
	.select(['email', 'password', 'name', 'created_at as createdAt'])
	.where('token', '=', request['query']['token'])
	.executeTakeFirst()
	.then(function (userVerification?: Pick<UserVerification, 'email' | 'password' | 'name' | 'createdAt'>): Promise<Pick<User, 'email' | 'password' | 'handle' | 'name' | 'createdAt'>> {
		if(typeof(userVerification) !== 'undefined') {
			return getUniqueRandomHandle()
			.then(function (handle: string): Pick<User, 'email' | 'password' | 'handle' | 'name' | 'createdAt'> {
				return {
					email: userVerification['email'],
					password: userVerification['password'],
					handle: handle,
					name: userVerification['name'],
					createdAt: userVerification['createdAt']
				};
			});
		} else {
			throw new BadRequest('Query[\'token\'] must be valid');
		}
	})
	.then(function (user: Pick<User, 'email' | 'password' | 'handle' | 'name' | 'createdAt'>): Promise<void> {
		return kysely.transaction()
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			return resolveInSequence<[InsertResult, DeleteResult]>([transaction.insertInto('user')
			.values({
				email: user['email'],
				password: user['password'],
				handle: user['handle'],
				name: user['name'],
				created_at: user['createdAt']
			})
			.executeTakeFirst(), transaction.deleteFrom('user_verification')
			.where('token', '=', request['query']['token']).executeTakeFirst()])
			.then(function (results: [InsertResult, DeleteResult]): void {
				if(results[0]['numInsertedOrUpdatedRows'] === 1n && results[0]['numInsertedOrUpdatedRows'] === 1n) {
					return;
				} else {
					throw new BadRequest('Query[\'token\'] must be valid');
				}
			});
		});
	})
	.then(function (): void {
		response.redirect('https://theater.isegye.kr/login');

		return;
	});
}