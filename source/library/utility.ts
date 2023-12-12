
import { Metadata, File } from '@library/type';
import { FILE_SIGNATURES, REPORT_TYPES } from '@library/constant';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { createHash, pbkdf2 } from 'crypto';
import { BadRequest } from './error';

export function getEpoch(): number {
	return Math.trunc(Date.now() / 1000);
}

export function getEncryptedPassword(password: string, salt: string): Promise<string> {
	return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
		pbkdf2(password, createHash('sha256').update(salt).digest(), Number(process['env']['PBKDF2_ITERATION']), 64, 'sha512', function (error: Error | null, encryptedPassword: Buffer) {
			if(error === null) {
				resolve(encryptedPassword.toString('hex'));
			} else {
				reject(error);
			}
		});

		return;
	});
}

export function execute(command: string, options?: {
	basePath?: string;
	isOutputNeeded?: false;
}): Promise<void>;
export function execute(command: string, options?: {
	basePath?: string;
	isOutputNeeded: true;
}): Promise<string>;
export function execute(command: string, options: {
	basePath?: string;
	isOutputNeeded?: boolean;
} = {}): Promise<string | void> {
	return new Promise<string | void>(function (resolve: ResolveFunction<string | void>, reject: RejectFunction): void {
		let output: string | undefined;

		const childProcess: ChildProcessWithoutNullStreams = spawn(command, {
			cwd: options['basePath'],
			shell: true,
		}).on('close', function (code: number): void {
			if(code === 0) {
				resolve(output);
			} else {
				reject(new Error('Process exited with code ' + code));
			}

			return;
		});

		if(options['isOutputNeeded'] === true) {
			output = '';

			childProcess['stdout']
			.on('data', function (data: Buffer): void {
				output += data.toString();

				return;
			});
		}

		return;
	});
}

export function isValidType(buffer: Buffer, fileType: File['type']): boolean {
	let isValidFile: boolean = false;

	for(let i: number = 0; i < FILE_SIGNATURES[fileType]['length']; i++) {
		if(buffer.includes(FILE_SIGNATURES[fileType][i])) {
			isValidFile = true;

			break;
		}
	}

	return isValidFile;
}

export function getMetadata(fileName: string, options?: {
	isVideo?: false;
	basePath?: string;
}): Promise<Metadata<'image'>>;
export function getMetadata(fileName: string, options: {
	isVideo: true;
	basePath?: string;
}): Promise<Metadata<'video'>>;
export function getMetadata(fileName: string, options: {
	isVideo?: boolean;
	basePath?: string;
} = {}): Promise<Metadata<'video' | 'image'>> {
	return execute('ffprobe -v quiet -print_format json -show_format -show_streams -show_entries format=size' + (options['isVideo'] === true ? ',duration,bit_rate:stream=bit_rate,avg_frame_rate,sample_rate,channels,display_aspect_ratio,' : ':stream=') + 'codec_type,width,height ' + fileName, {
		isOutputNeeded: true,
		basePath: options['basePath']
	})
	.then(function (output: string): Metadata<'video' | 'image'> {
		const result: {
			streams: [{
				codec_type: 'video';
				width: number;
				height: number;
				display_aspect_ratio: string;
				avg_frame_rate: string;
				bit_rate: string;
			}, {
				codec_type: 'audio';
				sample_rate: string;
				channels: number;
				bit_rate: string;
			}] | [{
				codec_type: 'video';
				width: number;
				height: number;
			}];
			format: {
				size: string;
				duration: string; // Do not use on image
				bit_rate: string; // Do not use on image
			};
		} = JSON.parse(output);

		switch(result['streams']['length']) {
			case 2: {
				// @ts-expect-error
				if(options['isVideo'] === true && result['streams'][0]['codec_type'] !== result['streams'][1]['codec_type']) {
					if(result['streams'][0]['codec_type'] !== 'video') {
						// @ts-expect-error
						result['streams'].push(result['streams'].pop());
					}

					const splitFramerate: string[] = result['streams'][0]['avg_frame_rate'].split('/');
					const videoBitRate: number = Number(result['streams'][0]['bit_rate']);
					const audioBitRate: number = Number(result['streams'][1]['bit_rate']);
					const totalBitRate: number = Number(result['format']['bit_rate']);

					return {
						video: {
							width: result['streams'][0]['width'],
							height: result['streams'][0]['height'],
							frameRate: Number(splitFramerate[0]) / Number(splitFramerate[1]),
							aspectRatio: result['streams'][0]['display_aspect_ratio'],
							bitRate: Number.isNaN(videoBitRate) ? totalBitRate - audioBitRate : videoBitRate
						},
						audio: {
							sampleRate: Number(result['streams'][1]['sample_rate']),
							channelCount: result['streams'][1]['channels'],
							bitRate: audioBitRate
						},
						index: Number(fileName.split('.')[0]),
						duration: Number(result['format']['duration']),
						size: Number(result['format']['size']),
						bitRate: totalBitRate
					};
				}

				break;
			}

			case 1: {
				if(result['streams'][0]['codec_type'] === 'video') {
					const greatestCommonDivisor: number = getGreatestCommonDivisor(result['streams'][0]['width'], result['streams'][0]['height']);

					return {
						video: {
							width: result['streams'][0]['width'],
							height: result['streams'][0]['height'],
							aspectRatio: result['streams'][0]['width'] / greatestCommonDivisor + ':' + result['streams'][0]['height'] / greatestCommonDivisor
						},
						size: Number(result['format']['size'])
					};
				}

				break;
			}
		}

		throw new Error('Media must contain valid streams');
	});
}

export function getGreatestCommonDivisor(a: number, b: number): number {
	if(Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0) {
		let r: number;

		while(b != 0) {
			r = a % b;
			a = b;
			b = r;
		}

		return a;
	} else {
		throw new Error('A and B must be natural number');
	}
}

type PromiseArray<T> = {
	[K in keyof T]: Promise<T[K]>;
}

export function resolveInSequence<T extends unknown[]>(promises: PromiseArray<T>): Promise<T> {
	const results: T[number][] = [];

	return promises.reduce(function (previousPromise: Promise<T[number]>, currentPromise: Promise<T[number]>): Promise<T[number]> {
		return previousPromise
		.then(function (result: T[number]): Promise<T[number]> {
			results.push(result);

			return currentPromise;
		});
	})
	.then(function (result: T[number]): T {
		return results.concat(result) as T;
	});
}

/**
 *  n	사용자
 * 
 * 1n	영화
 * 
 * 2n	회차
 * 
 * 3n	영화 댓글
 * 
 * 4n	회차 댓글
 */
export function getTargetTableName(type: keyof typeof REPORT_TYPES): 'user' | 'movie' | 'episode' | 'movie_comment' | 'episode_comment' {
	switch(type) {
		case 0:
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8: {
			return 'user';
		}
			
		case 10:
		case 11:
		case 12:
		case 13:
		case 14:
		case 15:
		case 16:
		case 17: {
			return 'movie';
		}

		case 20:
		case 21:
		case 22:
		case 23:
		case 24:
		case 25:
		case 26:
		case 27: {
			return 'episode';
		}

		case 30:
		case 31:
		case 32:
		case 33:
		case 34:
		case 35:
		case 36:
		case 37: {
			return 'movie_comment';
		}

		case 40:
		case 41:
		case 42:
		case 43:
		case 44:
		case 45:
		case 46:
		case 47: {
			return 'episode_comment';
		}
		
		default: {
			throw new BadRequest('Body[\'type\'] must be valid');
		}
	}
}