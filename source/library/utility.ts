
import { RejectFunction, ResolveFunction, Metadata, File } from '@library/type';
import { fileSignatures } from '@library/constant';
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

	for(let i: number = 0; i < fileSignatures[fileType]['length']; i++) {
		if(buffer.includes(fileSignatures[fileType][i])) {
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
						size: Number.parseInt(result['format']['size'], 10)
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

export function getMailContent(name: string, token: string): string {
	return '<main style="margin:0px auto;width:540px;height:600px;border-top:#5d63bd solid 8px;padding:0 8px;display:flex;flex-direction:column;justify-content:space-around;"><header style="font-size:24px;font-weight:normal;"><h1 style="font-size:32px;">이세계</h1><h2 style="font-size:24px;font-weight:normal;">이메일 인증 안내</h2></header><section style="display:flex;flex-direction:column;justify-content:space-around;gap:50px;"><article style="height:100px;display:flex;flex-direction:column;justify-content:space-evenly;"><p>안녕하세요 <strong>' + name + '</strong>님,</p><p>이세계에 오신 것을 환영합니다.</p><p>아래 버튼을 눌러 인증을 완료해주세요.</p></article><a id="button" href="https://api.isegye.kr/auth/email?token=' + token + '"><button style="border:0;background-color:#5d63bd;color:#ffffff;width:210px;height:45px;font-size:16px;">메일 인증</button></a></section><footer style="padding-top: 16px;border-top:black solid 1px;display:flex;flex-direction:column;"><small>만약 버튼이 정상적으로 눌러지지 않는다면, 아래 링크로 접속해주세요.</small><small><a href="https://api.isegye.kr/auth/email?token=' + token + '">https://api.isegye.kr/auth/email?token=' + token + '</a></small></footer></main>';
}


