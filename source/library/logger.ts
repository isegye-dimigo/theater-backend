import { Socket } from 'net';
import { inspect } from 'util';
import { LogLevel } from '@library/type';

export default class Logger {
	public static logger: Logger = new Logger();

	private static log(level: LogLevel, _arguments: unknown[]): void {
		let print: Socket['write'];
		let levelColor: number = 32;

		switch(level) {
			case 'error':
			case 'fatal': {
				print = process['stderr'].write.bind(process['stderr']);
				levelColor--;

				break;
			}

			case 'warn': {
				levelColor++;
			}

			default: {
				print = process['stdout'].write.bind(process['stdout']);
			}
		}

		const time: Date = new Date();

		for(let i: number = 0; i < _arguments['length']; i++) {
			if(typeof(_arguments[i]) === 'object') {
				_arguments[i] = inspect(_arguments[i], false, null, true);
			}
		}

		print('[\x1b[36m' + time.getHours().toString(10).padStart(2, '0') + ':' + time.getMinutes().toString(10).padStart(2, '0') + ':' + time.getSeconds().toString(10).padStart(2, '0') + '\x1b[37m][\x1b[' + levelColor + 'm' + level.toUpperCase() + '\x1b[37m]' + ' '.repeat(6 - level['length']) + _arguments.join(' ') + '\n');

		return;
	}

	public fatal(..._arguments: unknown[]): void {
		Logger.log('fatal', _arguments);

		return;
	}

	public error(..._arguments: unknown[]): void {
		Logger.log('error', _arguments);

		return;
	}

	public warn(..._arguments: unknown[]): void {
		Logger.log('warn', _arguments);

		return;
	}

	public info(..._arguments: unknown[]): void {
		Logger.log('info', _arguments);

		return;
	}

	public debug(..._arguments: unknown[]): void {
		Logger.log('debug', _arguments);

		return;
	}

	public trace(..._arguments: unknown[]): void {
		Logger.log('trace', _arguments);

		return;
	}
}