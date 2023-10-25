import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Media, MediaVideo, Prisma, Series } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		seriesId: Series['id'];
	};
	Body: Partial<Pick<Series, 'mediaId' | 'title' | 'description'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		let media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> | undefined;

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
								id: true,
								hash: true,
								width: true,
								height: true,
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
						.then(function (_media: Pick<Media, 'id' | 'hash' | 'width' | 'height'> & {
							mediaVideo: Pick<MediaVideo, 'id'> | null;
						} | null): void {
							if(_media !== null) {
								if(_media['mediaVideo'] === null) {
									media = _media;
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
		.then(function (): Promise<Prisma.BatchPayload> {
			return prisma['series'].updateMany({
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
		.then(function (result: Prisma.BatchPayload): void {
			if(result['count'] === 1) {
				reply.send({
					id: request['params']['seriesId'],
					media: media,
					title: request['body']['title'],
					description: request['body']['description']
				} satisfies Pick<Series, 'id'> & Partial<Pick<Series, 'title' | 'description'> & {
					media: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				}>);
			} else {
				throw new NotFound('Parameter[\'seriesId\'] must be valid');
			}
		})
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}
	
	return;
}