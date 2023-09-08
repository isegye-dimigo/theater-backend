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
	prisma['user'].findFirst({
		select: {
			id: true,
			password: true,
			handle: true,
			isVerified: true
		},
		where: {
			id: request['user']['id'],
			verificationKey: null,
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id' | 'password' | 'handle' | 'isVerified'> | null): void {
		if(user !== null) {
			const jsonWebToken: JsonWebToken = new JsonWebToken(request['body']['refreshToken'], user['password']);
			
			if(jsonWebToken.isValid()) {
				reply.send({
					accessToken: JsonWebToken.create({
						uid: user['id'],
						hdl: user['handle'],
						vrf: user['isVerified'],
						exp: getEpoch() + 7200 /* 2 hours */
					}, user['password'])
				});

				return;
			} else {
				throw new BadRequest('RefreshToken must be valid');
			}
		} else {
			throw new BadRequest('UserId must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}