import { prisma } from '@library/database';
import { BadRequest, Unauthorized } from '@library/httpError';
import JsonWebToken from '@library/jsonWebToken';
import { getEncryptedPassword, getEpoch } from '@library/utility';
import { User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<User, 'email' | 'password'>;
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true,
			password: true,
			handle: true,
			isVerified: true,
			createdAt: true
		},
		where: {
			email: request['body']['email'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id' | 'password' | 'handle' | 'isVerified' | 'createdAt'> | null): Promise<Pick<User, 'id' | 'password' | 'handle' | 'isVerified'>> {
		if(user !== null) {
			return getEncryptedPassword(request['body']['password'], user['createdAt'].getTime().toString(10))
			.then(function (encryptedPassword: string): Pick<User, 'id' | 'password' | 'handle' | 'isVerified'> {
				if(user['password'] === encryptedPassword) {
					return {
						id: user['id'],
						password: user['password'],
						handle: user['handle'],
						isVerified: user['isVerified']
					};
				} else {
					throw new Unauthorized('Body[\'password\'] must be valid');
				}
			});
		} else {
			throw new BadRequest('Body[\'email\'] must be valid');
		}
	})
	.then(function (user: Pick<User, 'id' | 'password' | 'handle' | 'isVerified'>): void {
		reply.send({
			user: {
				id: user['id'],
				handle: user['handle'],
				isVerified: user['isVerified']
			},
			refreshToken: JsonWebToken.create({
				uid: user['id']
			}, user['password']),
			accessToken: JsonWebToken.create({
				uid: user['id'],
				hdl: user['handle'],
				vrf: user['isVerified'],
				exp: getEpoch() + 7200 /* 2 hours */
			}, process['env']['JSON_WEB_TOKEN_SECRET'])
		});

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}