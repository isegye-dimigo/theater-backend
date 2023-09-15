import { FastifyReply, FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { BadRequest, InternalServerHttpError, Unauthorized, UnsupportedMediaType } from '@library/httpError';
import { getMetadata, isValidType } from '@library/utility';
import { join } from 'path/posix';
import { createReadStream, createWriteStream } from 'fs';
import { prisma } from '@library/database';
import { Media, MediaVideo, Prisma } from '@prisma/client';
import { FileType, Metadata, RejectFunction, ResolveFunction } from '@library/type';
import { deleteObjects, getObjectKeys, putObject } from '@library/bucket';
import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { FileHandle, open, readdir, rm } from 'fs/promises';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { read } from 'fs';
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
				.on('finish', function () {
					resolve();
					
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
				isVideo: true,
				duration: file['isVideo'],
				frameRate: file['isVideo'],
				bitRate: file['isVideo'],
				channelCount: file['isVideo'],
				createdAt: true,
				mediaVideos: file['isVideo']
			},
			where: {
				hash: fileHash
			}
		});
	})
	.then(function (media: Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
	} | null): Promise<void> | void {
		if(media === null) {
			if(file['isVideo']) {
				return new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
					spawn(`ffmpeg -v quiet -i input.mp4 -filter:v "scale='min(1280,iw)':min'(720,ih)':force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -map 0:v:0 -map 0:a:0 -c:v h264_qsv -c:a aac -q 23 -preset veryslow -f ssegment -segment_list "index.m3u8" "%d.ts"`, {
						cwd: file['basePath'],
						env: process['env'],
						shell: true
					})
					.once('exit', function (code: number, error: Error | null): void {
						if(error === null && code === 0) {
							resolve();
						} else {
							reject(new Error('Process exited unexpectedly'));
						}
					
						return;
					});
				
					return;
				});
			} else {
				return;
			}
		} else {
			throw media;
		}
	})
	.then(function (): Promise<void> | void {
		if(file['isVideo']) {
			return rm(file['path'], {
				force: true
			});
		} else {
			return;
		}
	})
	.then(function (): Promise<string[]> | undefined {
		if(file['isVideo']) {
			return readdir(file['basePath']);
		} else {
			return;
		}
	})
	.then(function (paths: string[] | undefined): Promise<ServiceOutputTypes[]> {
		const putObjectPromises: Promise<ServiceOutputTypes>[] = [];

		if(Array.isArray(paths)) {
			const meviaVideos: Prisma.MediaVideoCreateManyMediaInput[] = [];
			const standardMetadata: Metadata = getMetadata(paths[paths[0].endsWith('ts') ? 0 : 1], file['basePath']);

			media = {
				hash: file['hash'],
				userId: request['user']['id'],
				type: file['type'],
				size: 0,
				width: standardMetadata['video']['width'],
				height: standardMetadata['video']['height'],
				aspectRatio: standardMetadata['video']['aspectRatio'],
				isVideo: true,
				duration: 0,
				frameRate: 0,
				bitRate: 0,
				channelCount: standardMetadata['audio']['channelCount']
			};

			for(let i: number = 0; i < paths['length']; i++) {
				const filePath: string = join(file['basePath'], paths[i]);
				const isVideo: boolean = paths[i].endsWith('ts');

				if(isVideo) {
					const metadata: Metadata = getMetadata(filePath, file['basePath']);

					if(metadata['video']['bitRate'] < 0) {
						throw new InternalServerHttpError('Ffmpeg unknown error');
					}
					
					meviaVideos.push({
						index: meviaVideos['length'],
						size: metadata['size'],
						duration: metadata['duration'],
						frameRate: metadata['video']['frameRate'],
						videoBitRate: metadata['video']['bitRate'],
						sampleRate: metadata['audio']['sampleRate'],
						audioBitRate: metadata['audio']['bitRate']
					});


					media['size'] += metadata['size'];
					(media['duration'] as NonNullable<typeof media['duration']>) += metadata['duration'];
					(media['frameRate'] as NonNullable<typeof media['frameRate']>) += metadata['video']['frameRate'];
					(media['bitRate'] as NonNullable<typeof media['bitRate']>) += metadata['bitRate'];
				}

				putObjectPromises.push(putObject(join('videos', file['hash'], paths[i]), createReadStream(filePath), isVideo ? 'video/MP2T' : 'application/x-mpegURL'));
			}

			(media['frameRate'] as NonNullable<typeof media['frameRate']>) /= meviaVideos['length'];
			(media['bitRate'] as NonNullable<typeof media['bitRate']>) /= meviaVideos['length'];
			
			Object.assign(media, {
				mediaVideos: {
					createMany: {
						data: meviaVideos
					}
				}
			});
		} else {
			const metadata: Metadata = getMetadata(file['path'], file['basePath']);

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

			putObjectPromises.push(putObject(join('images', file['hash'] + '.' + file['type']), createReadStream(file['path']), file['mime']));
		}
		
		return Promise.all(putObjectPromises);
	})
	.then(function (): Promise<void> {
		return rm(file['basePath'], {
			force: true,
			recursive: true
		});
	})
	.then(function (): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
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
				isVideo: true,
				duration: file['isVideo'],
				frameRate: file['isVideo'],
				bitRate: file['isVideo'],
				channelCount: file['isVideo'],
				createdAt: true,
				mediaVideos: file['isVideo']
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