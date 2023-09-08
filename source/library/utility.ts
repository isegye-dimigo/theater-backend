
import { AudioStream, FileSignature, FileType, Metadata, RejectFunction, ResolveFunction, VideoStream } from '@library/type';
import { SpawnOptionsWithoutStdio, execSync, spawn } from 'child_process';
import { BinaryLike, Hash, createHash, pbkdf2 } from 'crypto';
import { createWriteStream, read } from 'fs';
import { PathLike } from 'fs';
import { FileHandle, open } from 'fs/promises';
import { Readable } from 'stream';

export function getEpoch(): number {
	return Math.trunc(Date.now() / 1000);
}

export function getEncryptedPassword(password: string, salt: string): Promise<string> {
	return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
		pbkdf2(password, salt, Number.parseInt(process['env']['PBKDF2_ITERATION'], 10), 64, 'sha512', function (error: Error | null, encryptedPassword: Buffer) {
			if(error === null) {
				resolve(encryptedPassword.toString('hex'));
			} else {
				reject(error);
			}
		});

		return;
	});
}

const fileSignatures: Record<FileType, FileSignature[]> = {
	mp4: [
	{
		offsetByte: 4,
		buffer: Buffer.from([0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32])
	},
	{
		offsetByte: 4,
		buffer: Buffer.from([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D])
	},
	{
		offsetByte: 4,
		buffer: Buffer.from([0x66, 0x74, 0x79, 0x70, 0x4D, 0x53, 0x4E, 0x56])
	},
	{
		offsetByte: 4,
		buffer: Buffer.from([0x66, 0x74, 0x79, 0x70, 0x33, 0x67, 0x70, 0x35])
	}],
	jpg: [{
		offsetByte: 0,
		buffer: Buffer.from([0xFF, 0xD8])
	}],
	png: [{
		offsetByte: 0,
		buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
	}]
}

export function isValidType(buffer: Buffer, fileType: FileType): boolean {
	console.log(buffer)
	let isValidFile: boolean = false;

	for(let i: number = 0; i < fileSignatures[fileType]['length']; i++) {
		console.log(buffer.includes(fileSignatures[fileType][i]['buffer']), fileSignatures[fileType][i]['buffer'].toString())

		if(buffer.includes(fileSignatures[fileType][i]['buffer'])) {
			isValidFile = true;

			break;
		}
	}

	return isValidFile;
}

export function getMetadata(fileName: string, basePath: string): Metadata {
	const result: {
		frames: {
			pkt_duration_time: string;
			pkt_size: string;
		}[];
		streams: (VideoStream | AudioStream)[];
		format: Record<'duration' | 'size' | 'bit_rate', string>;
	} = JSON.parse(execSync('ffprobe -v quiet -print_format json -show_format -show_streams -show_entries format=bit_rate,duration,size:stream=index,codec_type,bit_rate,avg_frame_rate,width,height,sample_rate,channels:frame=pkt_size,pkt_duration_time ' + fileName, {
		cwd: basePath,
		env: process['env']
	}).toString());

	if(result['streams']['length'] > 0) {
		// @ts-expect-error
		const metadata: Metadata = {
			duration: Number.parseFloat(result['format']['duration']),
			size: Number.parseInt(result['format']['size'], 10),
			bitRate: Number.parseInt(result['format']['bit_rate'], 10)
		};
	
		for(let i: number = 0; i < result['streams']['length']; i++) {
			if(typeof(metadata[result['streams'][i]['codec_type']]) === 'undefined') {
				if(result['streams'][i]['codec_type'] === 'video') {
					const splitFramerate: string[] = (result['streams'][i] as VideoStream)['avg_frame_rate'].split('/');
					
					const greatestCommonDivisor: number = getGreatestCommonDivisor((result['streams'][i] as VideoStream)['width'], (result['streams'][i] as VideoStream)['height']);
	
					metadata['video'] = {
						width: (result['streams'][i] as VideoStream)['width'],
						height: (result['streams'][i] as VideoStream)['height'],
						frameRate: Number.parseInt(splitFramerate[0], 10) / Number.parseInt(splitFramerate[1], 10),
						aspectRatio: (result['streams'][i] as VideoStream)['width'] / greatestCommonDivisor + ':' + (result['streams'][i] as VideoStream)['height'] / greatestCommonDivisor,
						bitRate: Number.parseInt((result['streams'][i] as VideoStream)['bit_rate'], 10)
					};
				} else {
					metadata['audio'] = {
						sampleRate: Number.parseInt((result['streams'][i] as AudioStream)['sample_rate'], 10),
						channelCount: (result['streams'][i] as AudioStream)['channels'],
						bitRate: Number.parseInt((result['streams'][i] as AudioStream)['bit_rate'], 10)
					};
				}
			}
		}

		
		if(typeof(metadata['video']) === 'object') {
			if(Number.isNaN(metadata['video']['bitRate']) && typeof(metadata['audio']) === 'object') {
				metadata['video']['bitRate'] = metadata['bitRate'] - metadata['audio']['bitRate'];
			}

			return metadata;

		} else {
			throw new Error('Media must contain both video and audio stream');
		}
	} else {
		throw new Error('Media must contain more than one stream');
	}
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

export function writeFileFromStream(path: PathLike, readable: Readable): Promise<void> {
	return new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
		readable.pipe(createWriteStream(path), {
			end: true
		})
		.on('finish', function () {
			resolve();
			
			return;
		})
		.once('error', reject);

		return;
	});
}

export function getHashFromStream(readable: Readable): Promise<string> {
	return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
		const hash: Hash = createHash('sha512').setEncoding('hex');

		readable.pipe(hash)
		.once('error', reject);
	
		hash.once('finish', function (): void {
			resolve(hash.read());
		})
		.once('error', reject);
	});
}

export function readPartialFile(path: string, size: number): Promise<Buffer> {
	return new Promise<Buffer>(function (resolve: ResolveFunction<Buffer>, reject: RejectFunction): void {
		open(path)
		.then(function (fileHandle: FileHandle): void {
			const buffer: Buffer = Buffer.alloc(size);

			read(fileHandle['fd'], buffer, 0, size, 0, function (error: Error | null): void {
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
}

export function execute(command: string, options: SpawnOptionsWithoutStdio = {}): Promise<void> {
	return new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
		spawn(command, Object.assign(options, {
			shell: true
		}))
		.once('exit', function (code: number, error: Error | null): void {
			if(error === null) {
				if(code === 0) {
					resolve();
				} else {
					reject(new Error('Process exited unexpectedly'));
				}
			} else {
				reject(error);
			}
		
			return;
		});
	
		return;
	});
}

/**
 * 0~9		사용자
 * 
 * 10~19	동영상
 * 
 * 20~29	댓글
 */
export const reportTypes = {
	0: '괴롭힘 및 사이버 폭력',
	1: '개인정보 침해',
	2: '명의 도용',
	3: '폭력적 위협',
	4: '보호 대상 집단에 대한 증오심 표현',
	5: '스팸 및 사기',
	6: '적절하지 않은 프로필 사진',
	7: '적절하지 않은 배너 사진',
	8: '기타',
	
	10: '성적인 콘텐츠',
	11: '폭력적 또는 혐오스러운 콘텐츠',
	12: '증오 또는 악의적인 콘텐츠',
	13: '괴롭힘 또는 폭력',
	14: '유해하거나 위험한 행위',
	15: '스팸 또는 혼동을 야기하는 콘텐츠',
	16: '법적 문제',
	17: '기타',

	20: '원치 않는 상업성 콘텐츠 또는 스팸',
	21: '포르노 또는 음란물',
	22: '증오심 표현 또는 노골적인 폭력',
	23: '태러 조장',
	24: '괴롭힘 또는 폭력',
	25: '자살 또는 자해',
	26: '잘못된 정보',
	27: '기타'
} as const;