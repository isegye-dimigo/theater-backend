import { FastifyReply, FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { BadRequest, PayloadTooLarge, Unauthorized, UnsupportedMediaType } from '@library/httpError';
import { execute, getMetadata, isValidType } from '@library/utility';
import { join } from 'path/posix';
import { WriteStream, createReadStream, createWriteStream, read } from 'fs';
import { prisma } from '@library/database';
import { Media, MediaVideo, MediaVideoMetadata, Prisma } from '@prisma/client';
import { FileType, Metadata, RejectFunction, ResolveFunction } from '@library/type';
import { deleteObjects, getObjectKeys, putObject } from '@library/bucket';
import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { FileHandle, mkdtemp, open, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { Hash, createHash } from 'crypto';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	/// @ts-expect-error :: imtoolazy
	const file: {
		inputPath: string;
		basePath: string;
		type: FileType;
		isVideo: boolean;
		hash: string;
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
			if(!request['raw']['destroyed']) {
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
					case 'jpg':
					case 'png': {
						break;
					}
	
					default: {
						throw new UnsupportedMediaType('File must be valid type');
					}
				}
	
				const fileSizeLimit: number = file['isVideo'] ? 17180000000 : 5243000;
				
				if(typeof(request['headers']['content-length']) === 'string') {
					if(Number.parseInt(request['headers']['content-length'], 10) <= fileSizeLimit) {
						file['inputPath'] = join(file['basePath'], 'input.' + file['type']);
	
						return new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
							const writeStream: WriteStream = createWriteStream(file['inputPath']).once('close', resolve).once('error', reject);
							let readFileSize: number = 0;
			
							multipartFile['file'].on('data', function (chunk: Buffer) {
								if(!multipartFile['file']['truncated']) {
									readFileSize += chunk['byteLength'];
									
									if(readFileSize > fileSizeLimit) {
										reply.send(new PayloadTooLarge('File must not exceed size limit'))
										.then(function () {
											writeStream.close(function () {
												request['raw'].destroy();
											
												return;
											});
			
											return;
										}, reject);
									}
								}
			
								return;
							}).once('error', reject).pipe(writeStream).once('error', reject);
			
							return;
						});
					} else {
						throw new PayloadTooLarge('File must not exceed size limit');
					}
				} else {
					throw new BadRequest('Header[\'Content-Length\'] must be exist');
				}
			} else {
				throw new BadRequest('File must be exist');
			}
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (): Promise<Buffer> {
		if(!request['raw']['destroyed']) {
			return open(file['inputPath'])
			.then(function (fileHandle: FileHandle): Promise<Buffer> {
				return new Promise<Buffer>(function (resolve: ResolveFunction<Buffer>, reject: RejectFunction): void {
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
	
					return;
				});
			});
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (partialBuffer: Buffer): Promise<string> {
		if(!request['raw']['destroyed']) {
			if(isValidType(partialBuffer, file['type'])) {
				return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
					const hash: Hash = createHash('sha512').setEncoding('hex');
	
					createReadStream(file['inputPath']).pipe(hash)
					.once('error', reject);
	
					hash.once('finish', function (): void {
						resolve(hash.read());
					})
					.once('error', reject);
				});
			} else {
				throw new UnsupportedMediaType('File must be valid type');
			}
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (fileHash: string): Promise<Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
	} | null> {
		if(!request['raw']['destroyed']) {
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
					createdAt: true,
					mediaVideos: true,
					mediaVideoMetadata: true
				},
				where: {
					hash: fileHash
				}
			});
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (media: Omit<Media, 'userId' | 'isDeleted'> & {
		mediaVideos: MediaVideo[];
	} | null): Promise<void> {
		if(!request['raw']['destroyed']) {
			if(media === null) {
				return execute('ffmpeg -v quiet -i input.' + file['type'] + ' -vf "scale=\'if(gte(iw,1270)*gte(ih,720),min(1270,iw),iw)\':\'if(gte(iw,720)*gte(ih,1280),min(1280,ih),ih)\'" -c:v ' + (file['isVideo'] ? 'h264_qsv -r 30 -map 0:v:0 -map 0:a:0 -c:a aac -q 17 -preset veryslow -f ssegment -segment_list index.m3u8 %d.ts' : 'libwebp -quality 100 -preset photo ' + file['hash'] + '.webp'), {
					basePath: file['basePath']
				});
			} else {
				// @ts-expect-error
				file['hash'] = undefined;
	
				throw media;
			}
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (): Promise<void> {
		if(!request['raw']['destroyed']) {
			return rm(file['inputPath'], {
				force: true
			});
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (): Promise<string[]> | string[] {
		if(!request['raw']['destroyed']) {
			return readdir(file['basePath']);
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(function (paths: string[]): Promise<ServiceOutputTypes> {
		if(!request['raw']['destroyed']) {
			if(paths['length'] === 1) {
				return getMetadata(paths[0], {
					basePath: file['basePath']
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
	
					return putObject(join('images', paths[0]), createReadStream(join(file['basePath'], paths[0])), 'image/webp');
				});
			} else {
				const metadataPromises: Promise<Metadata<'video'>>[] = [];
				const putObjectPromises: Promise<ServiceOutputTypes>[] = [];
	
				for(let i: number = 0; i < paths['length']; i++) {
					let mime: string = 'video/MP2T';
	
					if(paths[i].endsWith('ts')) {
						metadataPromises.push(getMetadata(paths[i], {
							isVideo: true,
							basePath: file['basePath']
						}));
					} else {
						mime = 'application/x-mpegURL';
					}
	
					putObjectPromises.push(putObject(join('videos', file['hash'], paths[i]), createReadStream(join(file['basePath'], paths[i])), mime));
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
		} else {
			throw new Error('Reuqest destroyed');
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
		if(!request['raw']['destroyed']) {
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
		} else {
			throw new Error('Reuqest destroyed');
		}
	})
	.then(reply.status(201).send.bind(reply))
	.catch(function (error: any): void {
		rm(file['basePath'], {
			force: true,
			recursive: true
		})
		.then(function (): Promise<string[]> | string[] {
			if(typeof(file['hash']) === 'string') {
				return file['isVideo'] ? getObjectKeys('vidoes/' + file['hash'] + '/') : ['images/' + file['hash'] + '.webp'];
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
			if(!request['raw']['destroyed']) {
				reply.send(error);
			} else {
				request['log'].error(error);
			}

			return;
		})
		.catch(function (error: Error) {
			if(!request['raw']['destroyed']) {
				reply.send(error);
			} else {
				request['log'].error(error);
			}

			return;
		});

		return;
	});

	return;
}