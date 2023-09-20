import { prisma } from '@library/database';
import { BadRequest, NotFound, Unauthorized } from '@library/httpError';
import { Media, MediaVideoMetadata, Movie } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest<{
	Params: {
		movieId: Movie['id'];
	};
	Body: Partial<Pick<Movie, 'title' | 'description' | 'imageMediaId'>>;
}>, reply: FastifyReply): void {
	if(request['user']['isVerified']) {
		if(Object.keys(request['body'])['length'] !== 0) {
			const isImageMediaIdDefined: boolean = typeof(request['body']['imageMediaId']) === 'number';

			prisma['movie'].findUnique({
				select: {
					userId: true,
					imageMedia: isImageMediaIdDefined ? {
						select: {
							isVideo: true
						}
					} : undefined
				},
				where: {
					id: request['params']['movieId'],
					isDeleted: false
				}
			})
			.then(function (movie: Pick<Movie, 'userId'> & {
				imageMedia?: Pick<Media, 'isVideo'> | null;
			} | null): Promise<void> | void {
				if(movie !== null) {
					if(movie['userId'] === request['user']['id']) {
						if(typeof(request['body']['imageMediaId']) === 'number') {
							if(typeof(movie['imageMedia']) !== 'undefined' && movie['imageMedia'] !== null) {
								if(movie['imageMedia']['isVideo']) {
									throw new BadRequest('Body[\'imageMediaId\'] must not be id of video');
								}
							} else {
								throw new BadRequest('Body[\'imageMediaId\'] must be valid')
							}
						}
						
						return;
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (): Promise<Pick<Movie, 'id' | 'title' | 'description'> & {
				imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'>;
				videoMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height' | 'isVideo'> & {
					mediaVideoMetadata: Pick<MediaVideoMetadata, 'duration' | 'frameRate'> | null;
				};
			}> {
				return prisma['movie'].update({
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
						title: request['body']['title'],
						description: request['body']['description'],
						imageMediaId: request['body']['imageMediaId']
					},
					where: {
						id: request['params']['movieId'],
						isDeleted: false
					}
				});
			})
			.then(reply.send.bind(reply))
			.catch(reply.send.bind(reply));
		} else {
			reply.send(new BadRequest('Body must have more than one key'));
		}
	} else {
		reply.send(new Unauthorized('User must be verified'));
	}

	return;
}