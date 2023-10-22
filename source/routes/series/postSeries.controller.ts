import { prisma } from '@library/database';
import { BadRequest } from '@library/httpError';
import { Media, MediaVideo, Series, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<Series, 'mediaId' | 'title' | 'description'>;
}>, reply: FastifyReply): void {
	prisma['media'].findUnique({
		select: {
			mediaVideo: {
				select: {
					id: true
				}
			}
		},
		where: {
			id: request['body']['mediaId']
		}
	})
	.then(function (media: {
		mediaVideo: Pick<MediaVideo, 'id'> | null;
	} | null): Promise<Pick<Series, 'id' | 'title' | 'description' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
		media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
	}> {
		if(media !== null) {
			if(media['mediaVideo'] === null) {
				return prisma['series'].create({
					select: {
						id: true,
						user: {
							select: {
								id: true,
								handle: true,
								name: true,
								isVerified: true
							}
						},
						media: {
							select: {
								id: true,
								hash: true,
								width: true,
								height: true
							}
						},
						title: true,
						description: true,
						createdAt: true
					},
					data: {
						userId: request['user']['id'],
						mediaId: request['body']['mediaId'],
						title: request['body']['title'],
						description: request['body']['description']
					}
				});
			} else {
				throw new BadRequest('Body[\'mediaId\'] must not be video');
			}
		} else {
			throw new BadRequest('Body[\'mediaId\'] must be valid');
		}
	})
	.then(reply.send.bind(reply))
	.catch(reply.send.bind(reply));
	
	return;
}