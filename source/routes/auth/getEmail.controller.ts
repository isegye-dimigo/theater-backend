import { getUniqueHandle, prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import { Prisma, User, UserVerification } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: Pick<UserVerification, 'token'>;
}>, reply: FastifyReply): void {
	prisma['userVerification'].findUnique({
		select: {
			email: true,
			password: true,
			name: true
		},
		where: {
			token: request['query']['token']
		}
	})
	.then(function (userVerification: Pick<UserVerification, 'email' | 'password' | 'name'> | null): Promise<Pick<User, 'email' | 'password' | 'handle' | 'name'>> {
		if(userVerification !== null) {
			return getUniqueHandle()
			.then(function (handle: string): Pick<User, 'email' | 'password' | 'handle' | 'name'> {
				return {
					email: userVerification['email'],
					password: userVerification['password'],
					handle: handle,
					name: userVerification['name']
				};
			});
		} else {
			throw new BadRequest('Query[\'token\'] must be valid');
		}
	})
	.then(function (user: Pick<User, 'email' | 'password' | 'handle' | 'name'>): Promise<Prisma.BatchPayload[]> {
		return prisma.$transaction([prisma['user'].createMany({
			data: user
		}), prisma['userVerification'].deleteMany({
			where: {
				token: request['query']['token']
			}
		})]);
	})
	.then(function (): void {
		// TODO: Chnage below url to real one
		reply.redirect(307, 'https://theater.isegye.kr/login');

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}