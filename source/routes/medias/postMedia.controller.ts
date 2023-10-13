import { FastifyReply, FastifyRequest } from 'fastify';
import { PayloadTooLarge, Unauthorized, UnsupportedMediaType } from '@library/httpError';
import { execute, getMetadata, isValidType } from '@library/utility';
import { join } from 'path/posix';
import { WriteStream, createReadStream, createWriteStream } from 'fs';
import { prisma } from '@library/database';
import { Media, MediaVideo, MediaVideoMetadata, Prisma } from '@prisma/client';
import { File, Metadata, RejectFunction, ResolveFunction } from '@library/type';
import { deleteObjects, getObjectKeys, putObject } from '@library/bucket';
import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { mkdtemp, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { Hash, createHash } from 'crypto';
import Busboy, { BusboyFileStream, BusboyHeaders } from '@fastify/busboy';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	mkdtemp(join(tmpdir(), 'isegye-'))
	.then(function (tempPath: string): Promise<File> {
		return new Promise<File>(function (resolve: ResolveFunction<File>, reject: RejectFunction): void {
			request['raw'].pipe(new Busboy({
				headers: request['raw']['headers'] as BusboyHeaders,
				limits: {
					files: 1
				}
			})
			.on('file', function (fieldName: string, stream: BusboyFileStream, fileName: string, transferEncoding: string, mimeType: string) {
				let isVideo: boolean = false;
				const hash: Hash = createHash('sha512').setEncoding('hex');
				let isHeaderChecked: boolean = false;
				let totalByteLength: number = 0;
				let type: File['type'];

				switch(mimeType) {
					case 'video/x-msvideo': {
						if(request['user']['isVerified']) {
							type = 'avi';
							isVideo = true;

							break;
						} else {
							reject(new Unauthorized('User must be verified'));

							return;
						}
					}

					case 'video/mp4': {
						if(request['user']['isVerified']) {
							type = 'mp4';
							isVideo = true;

							break;
						} else {
							reject(new Unauthorized('User must be verified'));

							return;
						}
					}

					case 'image/png': {
						type = 'png';

						break;
					}
					case 'image/jpeg': {
						type = 'jpg';

						break;
					}

					default: {
						reject(new UnsupportedMediaType('File must be valid type'));

						return;
					}
				}

				const byteLimit: number = isVideo ? 21470000000 : 5243000;

				if(Number.parseInt(request['headers']['content-length'] as string, 10) <= byteLimit) {
					const writeStream: WriteStream = createWriteStream(join(tempPath, 'input.' + type)).once('close', function (): void {
						resolve({
							path: tempPath,
							type: type,
							hash: hash.digest('hex'),
							isVideo: isVideo
						});

						return;
					}).once('error', function (): void {
						rm(tempPath, {
							force: true,
							recursive: true
						})
						.then(reject)
						.catch(reject);

						return;
					});

					stream.on('data', function (chunk: Buffer): void {
						if(totalByteLength <= byteLimit) {
							totalByteLength += chunk['byteLength'];

							hash.update(chunk);

							if(!isHeaderChecked) {
								if(isValidType(chunk, type)) {
									isHeaderChecked = true;
								} else {
									reply.send(new UnsupportedMediaType('File must be valid type'))
									.then(function (): void {console.log('-a')
										writeStream.close(function (): void {
											request['raw'].destroy();

											return;
										});

										return;
									}, reject);
								}
							}
						} else {
							reply.send(new PayloadTooLarge('File must not exceed size limit'))
							.then(function (): void {
								writeStream.close(function (): void {
									request['raw'].destroy();

									return;
								});

								return;
							}, reject);
						}

						return;
					}).once('error', reject).pipe(writeStream).once('error', reject);
				} else {
					reject(new PayloadTooLarge('File must not exceed size limit'));
				}

				return;
			}));

			return;
		});
	})
	.then(function (file: File): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
		mediaVideoMetadata: MediaVideoMetadata | null;
	}> {
		let media: Prisma.MediaUncheckedCreateInput;

		return prisma['media'].findUnique({
			select: {
				id: true,
				hash: true,
				type: true,
				size: true,
				width: true,
				height: true,
				aspectRatio: true,
				isVideo: true,
				createdAt: true,
				mediaVideos: true,
				mediaVideoMetadata: true
			},
			where: {
				hash: file['hash']
			}
		})
		.then(function (media: Omit<Media, 'userId' | 'isDeleted'> & {
			mediaVideos: MediaVideo[];
			mediaVideoMetadata: MediaVideoMetadata | null;
		} | null): Promise<void> {
			if(media === null) {
				return execute('ffmpeg -v quiet -i input.' + file['type'] + ' -vf "scale=\'if(gte(iw,ih),min(1280,iw),-1)\':\'if(lt(iw,ih),min(1280,ih),-1)\'" -c:v ' + (file['isVideo'] ? 'h264_qsv -r 30 -map 0:v:0 -map 0:a:0 -c:a aac -q 17 -preset veryslow -f ssegment -segment_list index.m3u8 %d.ts' : 'libwebp -quality 100 -preset photo ' + file['hash'] + '.webp'), {
					basePath: file['path']
				});
			} else {
				// @ts-ignore :: im to lazy
				file['hash'] = undefined;

				throw media;
			}
		})
		.then(function (): Promise<void> {
			return rm(join(file['path'], 'input.' + file['type']), {
				force: true
			});
		})
		.then(function (): Promise<string[]> {
			return readdir(file['path']);
		})
		.then(function (paths: string[]): Promise<ServiceOutputTypes> {
			if(paths['length'] === 1) {
				return getMetadata(paths[0], {
					basePath: file['path']
				})
				.then(function (metadata: Metadata<'image'>) {
					media = {
						hash: file['hash'],
						userId: request['user']['id'],
						type: file['type'],
						size: metadata['size'],
						width: metadata['video']['width'],
						height: metadata['video']['height'],
						aspectRatio: metadata['video']['aspectRatio'],
						isVideo: false
					};

					return putObject(join('images', paths[0]), createReadStream(join(file['path'], paths[0])), 'image/webp');
				});
			} else {
				const metadataPromises: Promise<Metadata<'video'>>[] = [];
				const putObjectPromises: Promise<ServiceOutputTypes>[] = [];

				for(let i: number = 0; i < paths['length']; i++) {
					let mime: string = 'video/MP2T';

					if(paths[i].endsWith('ts')) {
						metadataPromises.push(getMetadata(paths[i], {
							isVideo: true,
							basePath: file['path']
						}));
					} else {
						mime = 'application/x-mpegURL';
					}

					putObjectPromises.push(putObject(join('videos', file['hash'], paths[i]), createReadStream(join(file['path'], paths[i])), mime));
				}

				return Promise.all(metadataPromises)
				.then(function (metadatas: Metadata<'video'>[]) {
					media = {
						hash: file['hash'],
						userId: request['user']['id'],
						type: file['type'],
						size: 0,
						width: metadatas[0]['video']['width'],
						height: metadatas[0]['video']['height'],
						aspectRatio: metadatas[0]['video']['aspectRatio'],
						isVideo: true,
						mediaVideos: {
							createMany: {
								data: []
							}
						},
						mediaVideoMetadata: {
							create: {
								duration: 0,
								frameRate: 0,
								bitRate: 0,
								sampleRate: metadatas[0]['audio']['sampleRate'],
								channelCount: metadatas[0]['audio']['channelCount']
							}
						}
					};

					for(let i: number = 0; i < metadatas['length']; i++) {
						((media['mediaVideos'] as Required<Prisma.MediaVideoUncheckedCreateNestedManyWithoutMediaInput>)['createMany']['data'] as Prisma.MediaVideoCreateManyMediaInput[]).push({
							index: metadatas[i]['index'],
							size: metadatas[i]['size'],
							duration: metadatas[i]['duration'],
							videoBitRate: metadatas[i]['video']['bitRate'],
							audioBitRate: metadatas[i]['audio']['bitRate']
						});

						media['size'] += metadatas[i]['size'];
						(media['mediaVideoMetadata'] as Required<Prisma.MediaVideoMetadataUncheckedCreateNestedOneWithoutMediaInput>)['create']['duration'] += metadatas[i]['duration'];
						(media['mediaVideoMetadata'] as Required<Prisma.MediaVideoMetadataUncheckedCreateNestedOneWithoutMediaInput>)['create']['frameRate'] += metadatas[i]['video']['frameRate'];
						(media['mediaVideoMetadata'] as Required<Prisma.MediaVideoMetadataUncheckedCreateNestedOneWithoutMediaInput>)['create']['bitRate'] += metadatas[i]['bitRate'];
					}

					(media['mediaVideoMetadata'] as Required<Prisma.MediaVideoMetadataUncheckedCreateNestedOneWithoutMediaInput>)['create']['frameRate'] /= metadatas['length'];
					(media['mediaVideoMetadata'] as Required<Prisma.MediaVideoMetadataUncheckedCreateNestedOneWithoutMediaInput>)['create']['bitRate'] /= metadatas['length'];

					return putObjectPromises.reduce(function (previousPromise, currentPromise): Promise<ServiceOutputTypes> {
						return previousPromise.then(function (): Promise<ServiceOutputTypes> {
							return currentPromise;
						});
					});
				});
			}
		})
		.then(function (): Promise<void> {
			return rm(file['path'], {
				force: true,
				recursive: true
			});
		})
		.then(function (): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
			mediaVideos: MediaVideo[];
			mediaVideoMetadata: MediaVideoMetadata | null;
		}> {
			return prisma['media'].create({
				select: {
					id: true,
					hash: true,
					type: true,
					size: true,
					width: true,
					height: true,
					aspectRatio: true,
					isVideo: true,
					createdAt: true,
					mediaVideos: true,
					mediaVideoMetadata: true
				},
				data: media
			});
		})
		.catch(function (error: Error): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
			mediaVideos: MediaVideo[];
			mediaVideoMetadata: MediaVideoMetadata | null;
		}> {
			return rm(file['path'], {
				force: true,
				recursive: true
			})
			.then(function (): Promise<string[]> | string[] {
				if(typeof(file['hash']) === 'string') {
					return file['isVideo'] ? getObjectKeys('vidoes/' + file['hash'] + '/') : ['images/' + file['hash'] + '.webp'];
				} else {
					throw error;
				}
			})
			.then(function (objectKeys: string[]): Promise<ServiceOutputTypes> | undefined {
				if(objectKeys['length'] !== 0) {
					return deleteObjects(objectKeys);
				} else {
					throw error;
				}
			})
			.then(function (): Promise<Prisma.BatchPayload> {
				return prisma['media'].deleteMany({
					where: {
						hash: file['hash']
					}
				});
			})
			.then(function (): Omit<Media, 'userId' | 'isDeleted'> & {
				mediaVideos: MediaVideo[];
				mediaVideoMetadata: MediaVideoMetadata | null;
			} {
				throw error;
			});
		});
	})
	.then(reply.status(201).send.bind(reply))
	.catch(function (error: Error): void {
		if(!reply['sent']) {
			reply.send(error);
		}

		return;
	});


	return;
}