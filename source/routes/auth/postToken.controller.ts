import { kysely } from '@library/database';
import { BadRequest } from '@library/error';
import JsonWebToken from '@library/jsonWebToken';
import { User } from '@library/type';
import { Request, Response } from '@library/type';

export default function (request: Request<{
	body: {
		refreshToken: string;
	};
}>, response: Response): Promise<void> {
	const jsonWebToken: JsonWebToken = new JsonWebToken(request['body']['refreshToken'], '');

	return kysely.selectFrom('user')
	.select(['id', 'password', 'handle', 'name', 'is_verified as isVerified'])
	.where('id', '=', (jsonWebToken['payload'] as {
		uid: number;
	})['uid'])
	.where('is_deleted', '=', false)
	.executeTakeFirst()
	.then(function (user?: Pick<User, 'id' | 'password' | 'handle' | 'name' | 'isVerified'>): void {
		if(typeof(user) !== 'undefined') {
			jsonWebToken['secretKey'] = user['password'];

			if(jsonWebToken.isValid()) {
				response.send({
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
				} satisfies Record<'accessToken', string> & {
					user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
				});

				return;
			}
		}
		
		throw new BadRequest('Body[\'refreshToken\'] must be valid');
	});
}