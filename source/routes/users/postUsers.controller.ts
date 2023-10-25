import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import sendMail from '@library/mail';
import { getEncryptedPassword, getMailContent } from '@library/utility';
import { User, UserVerification } from '@prisma/client';
import { createHash } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<User, 'email' | 'password' | 'name'>;
}>, reply: FastifyReply): void {
	const createdAt: Date = new Date();

	prisma.$transaction([prisma['user'].findUnique({
		select: {
			id: true
		},
		where: {
			email: request['body']['email']
		}
	}), prisma['userVerification'].findUnique({
		select: {
			token: true
		},
		where: {
			email: request['body']['email']
		}
	})])
	.then(function (results: [Pick<User, 'id'> | null, Pick<UserVerification, 'token'> | null]): Promise<string> {
		if(results[0] === null) {
			if(results[1] === null) {
				return getEncryptedPassword(request['body']['password'], createdAt.getTime().toString(10));
			} else {
				return sendMail(request['body']['email'], '이세계 이메일 인증', getMailContent(request['body']['name'], results[1]['token']))
				.then(function (): string {
					throw null;
				});
			}
		} else {
			throw new Conflict('Body[\'email\'] must be unique');
		}
	})
	.then(function (encryptedPassword: string): Promise<Pick<UserVerification, 'id' | 'email' | 'name' | 'token' | 'createdAt'>> {
		return prisma['userVerification'].create({
			select: {
				id: true,
				email: true,
				name: true,
				token: true,
				createdAt: true
			},
			data: {
				email: request['body']['email'],
				password: encryptedPassword,
				name: request['body']['name'],
				token: createHash('sha1').update(request['body']['email']).digest('hex'),
				createdAt: createdAt
			}
		});
	})
	.then(function (userVerification: Pick<UserVerification, 'id' | 'email' | 'name' | 'token' | 'createdAt'>): Promise<Pick<UserVerification, 'id' | 'email' | 'name' | 'createdAt'>> {
		return sendMail(request['body']['email'], '이세계 이메일 인증', getMailContent(request['body']['name'], userVerification['token']))
		.then(function (): Pick<UserVerification, 'id' | 'email' | 'name' | 'createdAt'> {
			return {
				id: userVerification['id'],
				email: userVerification['email'],
				name: userVerification['name'],
				createdAt: userVerification['createdAt']
			};
		});
	})
	.then(reply.status(201).send.bind(reply))
	.catch(reply.send.bind(reply));

	return;
}