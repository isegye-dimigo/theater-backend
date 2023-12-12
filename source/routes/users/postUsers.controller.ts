import { kysely } from '@library/database';
import { Conflict } from '@library/error';
import { sendMail, getVerificationContent } from '@library/mail';
import { Database, Request, Response, User, UserVerification } from '@library/type';
import { getEncryptedPassword } from '@library/utility';
import { createHash } from 'crypto';
import { Transaction } from 'kysely';

export default function (request: Request<{
	body: Pick<User, 'email' | 'password' | 'name'>;
}>, response: Response): Promise<void> {
	const createdAt: Date = new Date();
	const token: string = createHash('sha1').update(request['body']['email']).digest('hex');

	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('user')
		.select('id')
		.where('user.email', '=', request['body']['email'])
		.unionAll(transaction.selectFrom('user_verification')
		.select('id')
		.where('user_verification.email', '=', request['body']['email']))
		.executeTakeFirst()
		.then(function (result?: Pick<User, 'id'>): Promise<string> {
			if(typeof(result) === 'undefined') {
				return getEncryptedPassword(request['body']['password'], Math.trunc(createdAt.getTime() / 1000).toString(10) + '000');
			} else {
				throw new Conflict('Body[\'email\'] must be unique');
			}
		})
		.then(function (encryptedPassword: string): Promise<Pick<UserVerification, 'id'>> {
			return transaction.insertInto('user_verification')
			.values({
				email: request['body']['email'],
				password: encryptedPassword,
				name: request['body']['name'],
				token: token,
				created_at: createdAt
			})
			.returning('id')
			.executeTakeFirstOrThrow();
		})
		.then(function (userVerification: Pick<UserVerification, 'id'>): Promise<void> {
			return sendMail(request['body']['email'], '이세계 이메일 인증', getVerificationContent(request['body']['name'], token))
			.then(function (): void {
				response.setStatus(201);
				response.send({
					id: userVerification['id'],
					email: request['body']['email'],
					name: request['body']['name'],
					createdAt: createdAt
				});

				return;
			});
		});
	});
}