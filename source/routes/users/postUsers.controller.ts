import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import sendMail from '@library/mail';
import { getEncryptedPassword, getMailContent } from '@library/utility';
import { Prisma, User, UserVerification } from '@prisma/client';
import { createHash } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<User, 'email' | 'password' | 'name'>;
}>, reply: FastifyReply): void {
	let token: string;

	Promise.all([prisma['user'].findUnique({
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
				return getEncryptedPassword(request['body']['password'], request['body']['email']);
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
	.then(function (encryptedPassword: string): Promise<Prisma.BatchPayload> {
		token = createHash('sha1').update(request['body']['email']).digest('hex');

		return prisma['userVerification'].createMany({
			data: {
				email: request['body']['email'],
				password: encryptedPassword,
				name: request['body']['name'],
				token: token
			}
		});
	})
	.then(function () {
		return sendMail(request['body']['email'], '이세계 이메일 인증', getMailContent(request['body']['name'], token));
	})
	.then(function () {
		reply.status(201).send({
			name: request['body']['name'],
			email: request['body']['email']
		});

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}