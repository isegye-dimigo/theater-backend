import { BadRequest, Unauthorized } from '@library/error';
import JsonWebToken from '@library/jsonWebToken';
import { kysely } from '@library/database';
import { Request, Response, User } from '@library/type';
import { getEncryptedPassword } from '@library/utility';

export default function (request: Request<{
	body: Pick<User, 'email' | 'password'>;
}>, response: Response): Promise<void> {
	return kysely.selectFrom('user')
	.select(['id', 'password', 'handle', 'name', 'is_verified as isVerified', 'created_at as createdAt'])
	.where('email', '=', request['body']['email'])
	.where('is_deleted', '=', false)
	.executeTakeFirst()
	.then(function (user?: Pick<User, 'id' | 'password' | 'handle' | 'name' | 'isVerified' | 'createdAt'>): Promise<Pick<User, 'id' | 'password' | 'name' | 'handle' | 'isVerified'>> {
		if(typeof(user) !== 'undefined') {
			return getEncryptedPassword(request['body']['password'], user['createdAt'].getTime().toString(10))
			.then(function (encryptedPassword: string): Pick<User, 'id' | 'password' | 'handle' | 'name' | 'isVerified'> {
				if(user['password'] === encryptedPassword) {
					return {
						id: user['id'],
						password: user['password'],
						handle: user['handle'],
						name: user['name'],
						isVerified: user['isVerified']
					};
				} else {
					throw new Unauthorized('Body[\'password\'] must be same');
				}
			});
		} else {
			throw new BadRequest('Body[\'email\'] must be valid');
		}
	}).then(function (user: Pick<User, 'id' | 'password' | 'handle' | 'name' | 'isVerified'>): void {
		response.send({
			refreshToken: JsonWebToken.create({
				uid: user['id']
			}, user['password']),
			accessToken: JsonWebToken.create({
				uid: user['id'],
				vrf: user['isVerified'],
				exp: JsonWebToken.getEpoch() + 7200 /* 2 hours */
			}, process['env']['JSON_WEB_TOKEN_SECRET']),
			user: {
				id: user['id'],
				handle: user['handle'],
				name: user['name'],
				isVerified: user['isVerified']
			}
		} satisfies Record<'refreshToken' | 'accessToken', string> & {
			user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
		});

		return;
	});
}