import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import sendMail from '@library/mail';
import { getEncryptedPassword } from '@library/utility';
import { User } from '@prisma/client';
import { createHash } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<User, 'email' | 'password' | 'name'>;
}>, reply: FastifyReply): void {
	prisma['user'].count({
		where: {
			email: request['body']['email']
		}
	})
	.then(function (userCount: number): Promise<string> {
		if(userCount === 0) {
			return getEncryptedPassword(request['body']['password'], request['body']['email']);
		} else {
			throw new Conflict('Body[\'email\'] must be unique');
		}
	})
	.then(function (encryptedPassword: string): Promise<Pick<User, 'id' | 'email' | 'verificationKey'>> {
		return prisma['user'].create({
			select: {
				id: true,
				email: true,
				verificationKey: true
			},
			data: {
				email: request['body']['email'],
				password: encryptedPassword,
				handle: request['body']['email'].replace(/[^A-Za-z0-9-_.]/g, '-'),
				name: request['body']['name'],
				verificationKey: createHash('sha1').update(request['body']['email']).digest('hex')
			}
		});
	})
	.then(function (user: Pick<User, 'id' | 'email' | 'verificationKey'>): Promise<Pick<User, 'id' | 'email'>> {
		return sendMail(user['email'], '이세계 이메일 인증', user['verificationKey'] as string)
		.then(function (): Pick<User, 'id' | 'email'> {
			return {
				id: user['id'],
				email: user['email']
			};
		});
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));
	
	return;
}