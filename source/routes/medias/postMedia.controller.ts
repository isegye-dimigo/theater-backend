import { FastifyReply, FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { BadRequest, PayloadTooLarge, Unauthorized, UnsupportedMediaType } from '@library/httpError';
import { execute, getImageMetadata, getVideoMetadata, isValidType } from '@library/utility';
import { join } from 'path/posix';
import { createReadStream, createWriteStream, read } from 'fs';
import { prisma } from '@library/database';
import { Media, MediaVideo, MediaVideoMetadata, Prisma } from '@prisma/client';
import { FileType, ImageMetadata, RejectFunction, ResolveFunction, VideoMetadata } from '@library/type';
import { deleteObjects, getObjectKeys, putObject } from '@library/bucket';
import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { FileHandle, mkdtemp, open, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { Hash, createHash } from 'crypto';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	/// @ts-expect-error :: imtoolazy
	const file: {
		path: string;
		basePath: string;
		type: FileType;
		isVideo: boolean;
		hash: string;
		mime: string;
	} = {
		isVideo: false
	};

	let media: Prisma.MediaUncheckedCreateInput;

	mkdtemp(join(tmpdir(), 'isegye-'))
	.then(function (basePath: string): Promise<MultipartFile | undefined> {
		file['basePath'] = basePath;

		return request.file();
	})
	.then(function (multipartFile: MultipartFile | undefined): Promise<void> {
		if(typeof(multipartFile) === 'object') {
			file['type'] = multipartFile['filename'].split('.').pop() as FileType;

			switch(file['type']) {
				case 'mp4': {
					if(request['user']['isVerified']) {
						file['isVideo'] = true;
						
						break;
					} else {
						throw new Unauthorized('User must be verified');
					}
				}
				case 'jpg': {
					file['mime'] = 'image/jpeg';

					break;
				}
				case 'png': {
					file['mime'] = 'image/png';

					break;
				}

				default: {
					throw new UnsupportedMediaType('File must be valid type');
				}
			}

			file['path'] = join(file['basePath'], 'input.' + file['type']);
			return new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
				multipartFile['file'].pipe(createWriteStream(file['path']), {
					end: true
				})
				.once('finish', function () {
					if(!multipartFile['file']['truncated'] && (file['isVideo'] || multipartFile['file']['bytesRead'] < 5243000)) {
						resolve();
					} else {
						reject(new PayloadTooLarge('File must not exceed size limit'));
					}
					
					return;
				})
				.once('error', reject);
		
				return;
			});
		} else {
			throw new BadRequest('File must be exist');
		}
	})
	.then(function (): Promise<Buffer> {
		return new Promise<Buffer>(function (resolve: ResolveFunction<Buffer>, reject: RejectFunction): void {
			open(file['path'])
			.then(function (fileHandle: FileHandle): void {
				const buffer: Buffer = Buffer.alloc(24);
	
				read(fileHandle['fd'], buffer, 0, 24, 0, function (error: Error | null): void {
					if(error === null) {
						fileHandle.close()
						.then(function (): void {
							resolve(buffer);
						})
						.catch(reject);
					} else {
						reject(error);
					}
	
					return;
				});
			})
		});
	})
	.then(function (partialBuffer: Buffer): Promise<string> {
		if(isValidType(partialBuffer, file['type'])) {
			return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
				const hash: Hash = createHash('sha512').setEncoding('hex');
		
				createReadStream(file['path']).pipe(hash)
				.once('error', reject);
			
				hash.once('finish', function (): void {
					resolve(hash.read());
				})
				.once('error', reject);
			});
		} else {
			throw new UnsupportedMediaType('File must be valid type');
		}
	})
	.then(function (fileHash: string): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
	} | null> {
		file['hash'] = fileHash;

		return prisma['media'].findUnique({
			select: {
				id: true,
				hash: true,
				type: true,
				size: true,
				width: true,
				height: true,
				aspectRatio: true,
				createdAt: true,
				mediaVideos: true,
				mediaVideoMetadata: true
			},
			where: {
				hash: fileHash
			}
		});
	})
	.then(function (media: Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
	} | null): Promise<string[]> | undefined {
		if(media === null) {
			if(file['isVideo']) {
				return execute('ffmpeg -v quiet -i input.mp4 -filter:v "scale=\'min(1280,iw)\':min\'(720,ih)\':force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -map 0:v:0 -map 0:a:0 -c:v h264_qsv -c:a aac -q 23 -preset veryslow -f ssegment -segment_list "index.m3u8" "%d.ts"', {
					basePath: file['basePath']
				})
				.then(function (): Promise<void> {
					return rm(file['path'], {
						force: true
					});
				})
				.then(function (): Promise<string[]> {
					return readdir(file['basePath']);
				});
			} else {
				return;
			}
		} else {
			throw media;
		}
	})
	.then(function (paths: string[] | undefined): Promise<ServiceOutputTypes[]> {
		if(Array.isArray(paths)) {
			const putObjectPromises: Promise<ServiceOutputTypes>[] = [];
			const metadataPromises: Promise<VideoMetadata>[] = [];

			for(let i: number = 0; i < paths['length']; i++) {
				const filePath: string = join(file['basePath'], paths[i]);
				let mime: string = 'video/MP2T';

				if(paths[i].endsWith('ts')) {
					metadataPromises.push(getVideoMetadata(filePath));
				} else {
					mime = 'application/x-mpegURL';
				}

				putObjectPromises.push(putObject(join('videos', file['hash'], paths[i]), createReadStream(filePath), mime));
			}

			return Promise.all(metadataPromises)
			.then(function (metadatas: VideoMetadata[]): Promise<ServiceOutputTypes[]> {
				media = {
					hash: file['hash'],
					userId: request['user']['id'],
					type: file['type'],
					size: 0,
					width: metadatas[0]['video']['width'],
					height: metadatas[0]['video']['height'],
					aspectRatio: metadatas[0]['video']['aspectRatio'],
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

				return Promise.all(putObjectPromises);
			});
		} else {
			return getImageMetadata(file['path'])
			.then(function (metadata: ImageMetadata): Promise<ServiceOutputTypes[]> {
				media = {
					hash: file['hash'],
					userId: request['user']['id'],
					type: file['type'],
					size: metadata['size'],
					width: metadata['width'],
					height: metadata['height'],
					aspectRatio: metadata['aspectRatio']
				};

				return Promise.all([putObject(join('images', file['hash'] + '.' + file['type']), createReadStream(file['path']), file['mime'])]);
			});
		}
	})
	.then(function (): Promise<void> {
		return rm(file['basePath'], {
			force: true,
			recursive: true
		});
	})
	.then(function (): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
		mediaVideoMetadata: MediaVideoMetadata | null;
	} | null> {
		return prisma['media'].create({
			select: {
				id: true,
				hash: true,
				type: true,
				size: true,
				width: true,
				height: true,
				aspectRatio: true,
				createdAt: true,
				mediaVideos: true,
				mediaVideoMetadata: true
			},
			data: media
		});
	})
	.then(reply.status(201).send.bind(reply))
	.catch(function (error: any): void {
		rm(file['basePath'], {
			force: true,
			recursive: true
		})
		.then(function (): Promise<string[]> | string[] {
			if(typeof(file['hash']) === 'string') {
				return file['isVideo'] ? getObjectKeys('vidoes/' + file['hash'] + '/') : ['images/' + file['hash'] + '.' + file['type']];
			} else {
				return [];
			}
		})
		.then(function (objectKeys: string[]): Promise<ServiceOutputTypes> | undefined {
			if(objectKeys['length'] !== 0) {
				return deleteObjects(objectKeys);
			} else {
				return;
			}
		})
		.then(function (): Promise<Prisma.BatchPayload> | undefined {
			if(typeof(file['hash']) === 'string') {
				return prisma['media'].deleteMany({
					where: {
						hash: file['hash']
					}
				});
			} else {
				return;
			}
		})
		.then(function (): void {
			reply.send(error);
			
			return;
		})
		.catch(reply.send.bind(reply));

		return;
	});

	return;
}