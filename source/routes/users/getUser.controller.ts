import { User } from '.prisma/client';
import { prisma } from '@library/database';
import { NotFound } from '@library/httpError';
import { Media } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		userHandle: User['handle'];
	};
}>, reply: FastifyReply): void {
	prisma['user'].findUnique({
		select: {
			id: true,
			handle: true,
			name: true,
			description: true,
			isVerified: true,
			profileMedia: {
				select: {
					id: true,
					hash: true,
					width: true,
					height: true
				}
			},
			bannerMedia: {
				select: {
					id: true,
					hash: true,
					width: true,
					height: true
				}
			},
			createdAt: true
		},
		where: {
			handle: request['params']['userHandle'],
			isDeleted: false
		}
	})
	.then(function (user: Pick<User, 'id' | 'handle' | 'name' | 'description' | 'isVerified' | 'createdAt'> & Record<'profileMedia' | 'bannerMedia', Pick<Media, 'id' | 'hash' | 'width' | 'height'> | null> | null): void {
		if(user !== null) {
			reply.send(user);

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	})
	.catch(reply.send.bind(reply));

	return;
}