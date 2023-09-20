import { prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import JsonWebToken from '@library/jsonWebToken';
import { getEpoch } from '@library/utility';
import { User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: {
		refreshToken: string;
	};
}>, reply: FastifyReply): void {
	const jsonWebToken: JsonWebToken = new JsonWebToken(request['body']['refreshToken'], '');

	prisma['user'].findUnique({
		select: {
			id: true,
			password: true,
			handle: true,
			isVerified: true
		},
		where: {
			id: jsonWebToken['payload']['id'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id' | 'password' | 'handle' | 'isVerified'> | null): void {
		if(user !== null) {
			jsonWebToken['secretKey'] = user['password'];

			if(jsonWebToken.isValid()) {
				reply.send({
					user: {
						id: user['id'],
						handle: user['handle'],
						isVerified: user['isVerified']
					},
					accessToken: JsonWebToken.create({
						uid: user['id'],
						hdl: user['handle'],
						vrf: user['isVerified'],
						exp: getEpoch() + 7200 /* 2 hours */
					}, process['env']['JSON_WEB_TOKEN_SECRET'])
				});

				return;
			}
		}

		throw new BadRequest('Body[\'refreshToken\'] must be valid');
	})
	.catch(reply.send.bind(reply));

	return;
}