import { prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import { User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Querystring: {
		verificationKey: string;
	};
}>, reply: FastifyReply): void {
	prisma['user'].count({
		where: {
			verificationKey: request['query']['verificationKey']
		}
	})
	.then(function (userCount: number): void {
		if(userCount === 1) {
			return;
		} else {
			throw new BadRequest('Query[\'verificationKey\'] must be valid');
		}
	})
	.then(function (): Promise<Pick<User, 'id'>> {
		return prisma['user'].update({
			select: {
				id: true
			},
			where: {
				verificationKey: request['query']['verificationKey']
			},
			data: {
				verificationKey: null
			}
		});
	})
	.then(function (): void {
		// TODO: Chnage below url to real one
		reply.redirect('https://theater.isegye.kr/login');

		return;
	})
	.catch(reply.send.bind(reply));

	return;
}