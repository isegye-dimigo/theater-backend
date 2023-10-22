import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Media, MediaVideo, Series, User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: Series['id'];
	};
	Body: Partial<Pick<Series, 'mediaId' | 'title' | 'description'>>;
}>, reply: FastifyReply): void {
	prisma['series'].findUnique({
		select: {
			userId: true
		},
		where: {
			id: request['params']['seriesId']
		}
	})
	.then(function (series: Pick<Series, 'userId'> | null): Promise<void> | void {
		if(series !== null) {
			if(series['userId'] === request['user']['id']) {
				if(typeof(request['body']['mediaId']) === 'number') {
					return prisma['media'].findUnique({
						select: {
							mediaVideo: {
								select: {
									id: true
								}
							}
						},
						where: {
							id: request['body']['mediaId'],
							isDeleted: false
						}
					})
					.then(function (media: {
						mediaVideo: Pick<MediaVideo, 'id'> | null;
					} | null): void {
						if(media !== null) {
							if(media['mediaVideo'] === null) {
								return;
							} else {
								throw new BadRequest('Body[\'mediaId\'] must not be video');
							}
						} else {
							throw new BadRequest('Body[\'mediaId\'] must be valid');
						}
					});
				} else {
					return;
				}
			} else {
				throw new Unauthorized('User must be same');
			}
		} else {
			throw new NotFound('Parameter[\'seriesId\'] must be valid');
		}
	})
	.then(function (): Promise<Pick<Series, 'id' | 'title' | 'description' | 'createdAt'> & {
		user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'>;
		media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
	}> {
		return prisma['series'].update({
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
				mediaId: request['body']['mediaId'],
				title: request['body']['title'],
				description: request['body']['description']
			},
			where: {
				id: request['params']['seriesId']
			}
		});
	})
	
	return;
}