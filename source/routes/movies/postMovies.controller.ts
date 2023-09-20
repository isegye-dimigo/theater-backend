import { prisma } from '@library/database';
import { BadRequest, Unauthorized } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Body: Pick<Movie, 'title' | 'description' | 'videoMediaId' | 'imageMediaId'>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		Promise.all([prisma['media'].findUnique({
			select: {
				videoMovie: {
					select: {
						id: true
					},
					where: {
						isDeleted: false
					}
				},
				isVideo: true
			},
			where: {
				id: request['body']['videoMediaId'],
				isDeleted: false
			}
		}), prisma['media'].findUnique({
			select: {
				imageMovie: {
					select: {
						id: true
					},
					where: {
						isDeleted: false
					}
				},
				isVideo: true
			},
			where: {
				id: request['body']['imageMediaId'],
				isDeleted: false
			}
		})])
		.then(function (medias: [Pick<Media, 'isVideo'> & {
			videoMovie: Pick<Movie, 'id'> | null;
		} | null, Pick<Media, 'isVideo'> & {
			imageMovie: Pick<Movie, 'id'> | null;
		} | null]): Promise<Pick<Movie, 'id' | 'title' | 'description'> & {
			imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
			videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> & {
				mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration' | 'frameRate'> | null;
			};
		}> {
			if(medias[0] !== null) {
				if(medias[0]['isVideo']) {
					if(medias[1] !== null) {
						if(!medias[1]['isVideo']) {
							return prisma['movie'].create({
								select: {
									id: true,
									title: true,
									description: true,
									imageMedia: {
										select: {
											id: true,
											hash: true,
											width: true,
											height: true,
											isVideo: true
										}
									},
									videoMedia: {
										select: {
											id: true,
											hash: true,
											width: true,
											height: true,
											isVideo: true,
											mediaVideoMetadata: {
												select: {
													duration: true,
													frameRate: true
												}
											}
										}
									}
								},
								data: {
									userId: request['user']['id'],
									title: request['body']['title'],
									description: request['body']['description'],
									videoMediaId: request['body']['videoMediaId'],
									imageMediaId: request['body']['imageMediaId'],
									movieStatistics: {
										createMany: {
											data: [{
												viewCount: 0,
												commentCount: 0,
												likeCount: 0,
												starAverage: 0
											}]
										}
									}
								}
							});
						} else {
							throw new BadRequest('Body[\'imageMediaId\'] must not be id of video');
						}
					} else {
						throw new BadRequest('Body[\'imageMediaId\'] must be valid');
					}
				} else {
					throw new BadRequest('Body[\'videoMediaId\'] must be id of video');
				}
			} else {
				throw new BadRequest('Body[\'videoMediaId\'] must be valid');
			}
		})
		.then(reply.status(201).send.bind(reply))
		.catch(reply.send.bind(reply));
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}