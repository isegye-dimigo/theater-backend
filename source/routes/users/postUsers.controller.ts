import { prisma } from '@library/database';
import { Conflict } from '@library/httpError';
import sendMail from '@library/mail';
import { getEncryptedPassword } from '@library/utility';
import { Prisma, User, UserVerification } from '@prisma/client';
import { createHash } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<User, 'email' | 'password' | 'name'>;
}>, reply: FastifyReply): void {
	let token: string;

	Promise.all([prisma['user'].count({
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
	.then(function (results: [number, Pick<UserVerification, 'token'> | null]): Promise<string> {
		if(results[0] === 0) {
			if(results[1] === null) {
				return getEncryptedPassword(request['body']['password'], request['body']['email']);
			} else {
				return sendMail(request['body']['email'], '이세계 이메일 인증', '<main style="margin:0px auto;width:540px;height:600px;border-top:#5d63bd solid 8px;padding:0 8px;display:flex;flex-direction:column;justify-content:space-around;"><header style="font-size:24px;font-weight:normal;"><h1 style="font-size:32px;">이세계</h1><h2 style="font-size:24px;font-weight:normal;">이메일 인증 안내</h2></header><section style="display:flex;flex-direction:column;justify-content:space-around;gap:50px;"><article style="height:100px;display:flex;flex-direction:column;justify-content:space-evenly;"><p>안녕하세요 <strong>' + request['body']['name'] + '</strong>님,</p><p>이세계에 오신 것을 환영합니다.</p><p>아래 버튼을 눌러 인증을 완료해주세요.</p></article><a id="button" href="https://api.isegye.kr/auth/email?token=' + results[1]['token'] + '"><button style="border:0;background-color:#5d63bd;color:#ffffff;width:210px;height:45px;font-size:16px;">메일 인증</button></a></section><footer style="padding-top: 16px;border-top:black solid 1px;display:flex;flex-direction:column;"><small>만약 버튼이 정상적으로 눌러지지 않는다면, 아래 링크로 접속해주세요.</small><small><a href="https://api.isegye.kr/auth/email?token=' + results[1]['token'] + '">https://api.isegye.kr/auth/email?token=' + results[1]['token'] + '</a></small></footer></main>')
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
		return sendMail(request['body']['email'], '이세계 이메일 인증', '<main style="margin:0px auto;width:540px;height:600px;border-top:#5d63bd solid 8px;padding:0 8px;display:flex;flex-direction:column;justify-content:space-around;"><header style="font-size:24px;font-weight:normal;"><h1 style="font-size:32px;">이세계</h1><h2 style="font-size:24px;font-weight:normal;">이메일 인증 안내</h2></header><section style="display:flex;flex-direction:column;justify-content:space-around;gap:50px;"><article style="height:100px;display:flex;flex-direction:column;justify-content:space-evenly;"><p>안녕하세요 <strong>' + request['body']['name'] + '</strong>님,</p><p>이세계에 오신 것을 환영합니다.</p><p>아래 버튼을 눌러 인증을 완료해주세요.</p></article><a id="button" href="https://api.isegye.kr/auth/email?token=' + token + '"><button style="border:0;background-color:#5d63bd;color:#ffffff;width:210px;height:45px;font-size:16px;">메일 인증</button></a></section><footer style="padding-top: 16px;border-top:black solid 1px;display:flex;flex-direction:column;"><small>만약 버튼이 정상적으로 눌러지지 않는다면, 아래 링크로 접속해주세요.</small><small><a href="https://api.isegye.kr/auth/email?token=' + token + '">https://api.isegye.kr/auth/email?token=' + token + '</a></small></footer></main>');
	})
	.then(function () {
		reply.status(201).send(null);

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}