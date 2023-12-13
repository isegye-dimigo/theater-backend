import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { deleteObjects, getObjectKeys, putObject } from '@library/bucket';
import { kysely } from '@library/database';
import { BadRequest } from '@library/error';
import { Database, Media, MediaPart, MediaVideo, Metadata, Request, Response } from '@library/type';
import { execute, getMetadata, resolveInSequence } from '@library/utility';
import { createReadStream } from 'fs';
import { readdir, rm } from 'fs/promises';
import { Transaction } from 'kysely';
import { join } from 'path/posix';

export default function (request: Request, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		let media: Pick<Media, 'id' | 'hash' | 'type' | 'size' | 'width' | 'height' | 'aspectRatio' | 'createdAt'> & {
			video?: Pick<MediaVideo, 'id' | 'duration' | 'frameRate' | 'bitRate' | 'sampleRate' | 'channelCount'>;
			parts?: Pick<MediaPart, 'id' | 'index' | 'size' | 'duration' | 'videoBitRate' | 'audioBitRate'>[];
		};
		
		return transaction.selectFrom('media')
		.select(['media.id', 'media.hash', 'media.type', 'media.size', 'media.width', 'media.height', 'media.aspect_ratio as aspectRatio', 'media.created_at as createdAt'])
		.where('media.hash', '=', request['file']['hash'])
		.leftJoin('media_video as video', 'media.id', 'video.media_id')
		.select(['video.id as video_id', 'video.duration as video_duration', 'video.frame_rate as video_frameRate', 'video.bit_rate as video_bitRate', 'video.sample_rate as video_sampleRate', 'video.channel_count as video_channelCount'])
		.executeTakeFirst()
		.then(function (rawMedia?: Pick<Media, 'id' | 'hash' | 'type' | 'size' | 'width' | 'height' | 'aspectRatio' | 'createdAt'> & Nullable<PrefixPick<MediaVideo, 'video_', 'id' | 'duration' | 'frameRate' | 'bitRate' | 'sampleRate' | 'channelCount'>>) {
			if(typeof(rawMedia) === 'undefined') {
				return execute('ffmpeg -v quiet -i input.' + request['file']['type'] + ' -vf "scale=\'if(gt(iw*ih,921600),iw/sqrt(iw*ih/921600),iw)\':\'if(gt(iw*ih,921600),ih/sqrt(iw*ih/921600),ih)\'" -c:v ' + (request['file']['isVideo'] ? 'h264_qsv -c:a aac -map 0:v:0 -map 0:a:0 -r 30 -q 17 -preset veryslow -f ssegment -segment_list index.m3u8 %d.ts' : 'libwebp -quality 100 -preset photo ' + request['file']['hash'] + '.webp'), {
					basePath: request['file']['path']
				});
			} else {
				media = {
					id: rawMedia['id'],
					hash: rawMedia['hash'],
					type: rawMedia['type'],
					size: rawMedia['size'],
					width: rawMedia['width'],
					height: rawMedia['height'],
					aspectRatio: rawMedia['aspectRatio'],
					createdAt: rawMedia['createdAt']
				};

				if(rawMedia['video_id'] !== null) {
					media['video'] = {
						id: rawMedia['video_id'],
						duration: rawMedia['video_duration'] as number,
						frameRate: rawMedia['video_frameRate'] as number,
						bitRate: rawMedia['video_bitRate'] as number,
						sampleRate: rawMedia['video_sampleRate'] as number,
						channelCount: rawMedia['video_channelCount'] as number
					};

					return transaction.selectFrom('media_part')
					.select(['id', 'index', 'size', 'duration', 'video_bit_rate as videoBitRate', 'audio_bit_rate as audioBitRate'])
					.where('media_id', '=', media['id'])
					.execute()
					.then(function (parts: Pick<MediaPart, 'id' | 'index' | 'size' | 'duration' | 'videoBitRate' | 'audioBitRate'>[]): void {
						media['parts'] = parts;

						throw null;
					});
				} else {
					throw null;
				}
			}
		})
		.then(function (): Promise<void> {
			return rm(join(request['file']['path'], 'input.' + request['file']['type']), {
				force: true
			});
		})
		.then(function (): Promise<string[]> {
			return readdir(request['file']['path']);
		})
		.then(function (paths: string[]): Promise<[Metadata<'image'>] | [Metadata<'video'>[], Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>]> {
			if(paths['length'] === 1) {
				return getMetadata(paths[0], {
					basePath: request['file']['path']
				})
				.then(function (metadata: Metadata<'image'>): Promise<[Metadata<'image'>]> {
					return putObject(join('images', paths[0]), createReadStream(join(request['file']['path'], paths[0])), 'image/webp')
					.then(function (): [Metadata<'image'>] {
						return [metadata];
					});
				});
			} else {
				const metadataPromises: Promise<Metadata<'video'>>[] = [];
				const putObjectPromises: Promise<ServiceOutputTypes>[] = [];

				for(let i: number = 0; i < paths['length']; i++) {
					let mime: string = 'video/MP2T';

					if(paths[i].endsWith('ts')) {
						metadataPromises.push(getMetadata(paths[i], {
							isVideo: true,
							basePath: request['file']['path']
						}));
					} else {
						mime = 'application/x-mpegURL';
					}

					putObjectPromises.push(putObject(join('videos', request['file']['hash'], paths[i]), createReadStream(join(request['file']['path'], paths[i])), mime));
				}

				return resolveInSequence(metadataPromises)
				.then(function (metadatas: Metadata<'video'>[]): Promise<[Metadata<'video'>[], Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>]> {
					const standardMetadata: Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'> = {
						size: 0,
						duration: 0,
						frameRate: 0,
						bitRate: 0
					};

					for(let i: number = 0; i < metadatas['length']; i++) {
						standardMetadata['size'] += metadatas[i]['size'];
						standardMetadata['duration'] += metadatas[i]['duration'];
						standardMetadata['frameRate'] += metadatas[i]['video']['frameRate'];
						standardMetadata['bitRate'] += metadatas[i]['bitRate'];
					}

					standardMetadata['frameRate'] /= metadatas['length'];
					standardMetadata['bitRate'] /= metadatas['length'];

					return resolveInSequence(putObjectPromises)
					.then(function (): [Metadata<'video'>[], Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>] {
						return [metadatas, standardMetadata];
					});
				});
			}
		})
		.then(function (metadatas: [Metadata<'image'>] | [Metadata<'video'>[], Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>]): Promise<void> {
			return transaction.insertInto('media')
			.values(Object.assign({
				user_id: request['user']['id'],
				hash: request['file']['hash'],
				type: request['file']['type']
			} as const, request['file']['isVideo'] ? {
				size: (metadatas[0] as Metadata<'video'>[])[0]['size'],
				width: (metadatas[0] as Metadata<'video'>[])[0]['video']['width'],
				height: (metadatas[0] as Metadata<'video'>[])[0]['video']['height'],
				aspect_ratio: (metadatas[0] as Metadata<'video'>[])[0]['video']['aspectRatio']
			} : {
				size: (metadatas[0] as Metadata<'image'>)['size'],
				width: (metadatas[0] as Metadata<'image'>)['video']['width'],
				height: (metadatas[0] as Metadata<'image'>)['video']['height'],
				aspect_ratio: (metadatas[0] as Metadata<'image'>)['video']['aspectRatio']
			}))
			.returning(['id', 'created_at as createdAt'])
			.executeTakeFirstOrThrow()
			.then(function (rawMedia: Pick<Media, 'id' | 'createdAt'>): Promise<void> | void {
				media = Object.assign({
					id: rawMedia['id'],
					hash: request['file']['hash'],
					type: request['file']['type']
				} as const, request['file']['isVideo'] ? {
					size: (metadatas[0] as Metadata<'video'>[])[0]['size'],
					width: (metadatas[0] as Metadata<'video'>[])[0]['video']['width'],
					height: (metadatas[0] as Metadata<'video'>[])[0]['video']['height'],
					aspectRatio: (metadatas[0] as Metadata<'video'>[])[0]['video']['aspectRatio']
				} : {
					size: (metadatas[0] as Metadata<'image'>)['size'],
					width: (metadatas[0] as Metadata<'image'>)['video']['width'],
					height: (metadatas[0] as Metadata<'image'>)['video']['height'],
					aspectRatio: (metadatas[0] as Metadata<'image'>)['video']['aspectRatio']
				}, {
					createdAt: rawMedia['createdAt']
				});

				if(request['file']['isVideo']) {
					const parts: Pick<Database['media_part'], 'media_id' | 'index' | 'size' | 'duration' | 'video_bit_rate' | 'audio_bit_rate'>[] = [];
					
					for(let i: number = 0; i < (metadatas[0] as Metadata<'video'>[])['length']; i++) {
						parts.push({
							media_id: rawMedia['id'],
							index: (metadatas[0] as Metadata<'video'>[])[i]['index'],
							size: (metadatas[0] as Metadata<'video'>[])[i]['size'],
							duration: (metadatas[0] as Metadata<'video'>[])[i]['duration'],
							video_bit_rate: (metadatas[0] as Metadata<'video'>[])[i]['video']['bitRate'],
							audio_bit_rate: (metadatas[0] as Metadata<'video'>[])[i]['audio']['bitRate']
						});
					}

					return resolveInSequence<[Pick<MediaVideo, 'id'>, Pick<MediaPart, 'id'>[]]>([transaction.insertInto('media_video')
					.values({
						media_id: rawMedia['id'],
						duration: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['duration'],
						frame_rate: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['frameRate'],
						bit_rate: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['bitRate'],
						sample_rate: (metadatas[0] as Metadata<'video'>[])[0]['audio']['sampleRate'],
						channel_count: (metadatas[0] as Metadata<'video'>[])[0]['audio']['channelCount']
					})
					.returning('id')
					.executeTakeFirstOrThrow(), transaction.insertInto('media_part')
					.values(parts)
					.returning('id')
					.execute()])
					.then(function (videoAndParts: [Pick<MediaVideo, "id">, Pick<MediaPart, "id">[]]): void {
						media['video'] = {
							id: videoAndParts[0]['id'],
							duration: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['duration'],
							frameRate: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['frameRate'],
							bitRate: (metadatas[1] as Pick<Media, 'size'> & Pick<MediaVideo, 'duration' | 'frameRate' | 'bitRate'>)['bitRate'],
							sampleRate: (metadatas[0] as Metadata<'video'>[])[0]['audio']['sampleRate'],
							channelCount: (metadatas[0] as Metadata<'video'>[])[0]['audio']['channelCount']
						};

						media['parts'] = [];

						for(let i: number = 0; i < parts['length']; i++) {
							media['parts'].push({
								id: videoAndParts[1][i]['id'],
								index: parts[i]['index'],
								size: parts[i]['size'],
								duration: parts[i]['duration'],
								videoBitRate: parts[i]['video_bit_rate'],
								audioBitRate: parts[i]['audio_bit_rate']
							});
						}

						return;
					});
				} else {
					return;
				}
			});
		})
		.then(function (): Promise<void> {
			return rm(request['file']['path'], {
				force: true,
				recursive: true
			});
		})
		.then(function (): void {
			if(!request['destroyed']) {
				response.send(media);
			} else {
				throw new BadRequest('Request destroyed');
			}

			return;
		})
		.catch(function (error: unknown): Promise<void> | void {
			if(typeof(media) === 'undefined') {
				return rm(request['file']['path'], {
					force: true,
					recursive: true
				})
				.then(function (): Promise<string[]> | string[] {
					return request['file']['isVideo'] ? getObjectKeys('videos/' + request['file']['hash']) : ['images/' + request['file']['hash'] + '.webp'];
				})
				.then(function (keys: string[]): Promise<ServiceOutputTypes> | undefined {
					return keys['length'] !== 0 ? deleteObjects(keys) : undefined;
				})
				.then(function (): void {
					throw error;
				});
			} else {
				response.send(media);

				return;
			}
		});
	});
}