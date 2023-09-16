
import { FileSignature, FileType, VideoMetadata, RejectFunction, ResolveFunction, ImageMetadata } from '@library/type';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { pbkdf2 } from 'crypto';

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

export function 	execute(command: string, isOutputNeeded?: {
	basePath?: string;
	isOutputNeeded?: false;
}): Promise<void>;
export function execute(command: string, isOutputNeeded?: {
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
		}).on('close', function (code: number, error): void {
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

export function isValidType(buffer: Buffer, fileType: FileType): boolean {
	let isValidFile: boolean = false;

	for(let i: number = 0; i < fileSignatures[fileType]['length']; i++) {
		if(buffer.includes(fileSignatures[fileType][i]['buffer'])) {
			isValidFile = true;

			break;
		}
	}

	return isValidFile;
}

export function getVideoMetadata(fileName: string): Promise<VideoMetadata> {
	return execute('ffprobe -v quiet -print_format json -show_format -show_streams -show_entries format=bit_rate,duration,size:stream=index,codec_type,bit_rate,avg_frame_rate,width,height,sample_rate,channels,display_aspect_ratio ' + fileName, {
		isOutputNeeded: true
	})
	.then(function (output: string): VideoMetadata {
		const result: {
			streams: [{
				index: number;
				codec_type: 'video';
				width: number;
				height: number;
				display_aspect_ratio: string;
				avg_frame_rate: string;
				bit_rate: string;
			}, {
				index: number;
				codec_type: 'audio';
				sample_rate: string;
				channels: number;
				bit_rate: string;
			}];
			format: Record<'duration' | 'size' | 'bit_rate', string>;
		} = JSON.parse(output);

		// @ts-expect-error
		if(result['streams']['length'] === 2 && result['streams'][0]['codec_type'] !== result['streams'][1]['codec_type']) {
			if(result['streams'][0]['codec_type'] !== 'video') {
				// @ts-expect-error
				result['streams'].push(result['streams'].pop());
			}
			
			const splitFramerate: string[] = result['streams'][0]['avg_frame_rate'].split('/');
			const videoBitRate: number = Number.parseInt(result['streams'][0]['bit_rate'], 10);
			const audioBitRate: number = Number.parseInt(result['streams'][1]['bit_rate'], 10);
			const totalBitRate: number = Number.parseInt(result['format']['bit_rate'], 10);
		
			return {
				video: {
					width: result['streams'][0]['width'],
					height: result['streams'][0]['height'],
					frameRate: Number.parseInt(splitFramerate[0], 10) / Number.parseInt(splitFramerate[1], 10),
					aspectRatio: result['streams'][0]['display_aspect_ratio'],
					bitRate: Number.isNaN(videoBitRate) ? totalBitRate - audioBitRate : videoBitRate
				},
				audio: {
					sampleRate: Number.parseInt(result['streams'][1]['sample_rate'], 10),
					channelCount: result['streams'][1]['channels'],
					bitRate: audioBitRate
				},
				index: Number.parseInt(fileName.split('.')[0], 10),
				duration: Number.parseFloat(result['format']['duration']),
				size: Number.parseInt(result['format']['size'], 10),
				bitRate: totalBitRate
			};
		} else {
			throw new Error('Media must contain valid streams');
		}
	});
}

export function getImageMetadata(fileName: string): Promise<ImageMetadata> {
	return execute('exiftool -j -ImageWidth -ImageHeight -Orientation# -FileSize#  ' + fileName, {
		isOutputNeeded: true
	})
	.then(function (output: string): ImageMetadata {
		const result: Record<'ImageWidth' | 'ImageHeight' | 'Orientation' | 'FileSize', number> = JSON.parse(output)[0];
		
		if(typeof(result['Orientation']) === 'number' && result['Orientation'] >= 5) {
			[result['ImageHeight'], result['ImageWidth']] = [result['ImageWidth'], result['ImageHeight']];
		}

		const greatestCommonDivisor: number = getGreatestCommonDivisor(result['ImageWidth'], result['ImageHeight']);
			
		return {
			width: result['ImageWidth'],
			height: result['ImageHeight'],
			aspectRatio: result['ImageWidth'] / greatestCommonDivisor + ':' + result['ImageHeight'] / greatestCommonDivisor,
			size: result['FileSize']
		};
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