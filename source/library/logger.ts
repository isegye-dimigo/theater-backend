import { FastifyBaseLogger } from 'fastify';
import { LogLevel } from 'fastify/types/logger';
import { Socket } from 'net';
import { inspect } from 'util';

export default class Logger implements FastifyBaseLogger {
	public level: LogLevel = 'silent';
	public static levelRank: Record<LogLevel, number> = {
		fatal: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		trace: 5,
		silent: -1
	};

	static log(level: LogLevel, _arguments: Record<string, any>): void {
		if(typeof(_arguments[0]['req']) === 'undefined') {
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

			print('[\x1b[36m' + (new Date()).toTimeString().slice(0, 8) + '\x1b[37m][\x1b[' + levelColor + 'm' + level.toUpperCase() + '\x1b[37m]' + ' '.repeat(6 - level['length']));

			switch(typeof(_arguments[0])) {
				case 'string': {
					print(_arguments[0]);

					break;
				}

				case 'object': {
					if(typeof(_arguments[0]['res']) === 'object') {
						print(_arguments[0]['res']['request']['ip'] + ' "' + _arguments[0]['res']['request']['method'] + ' ' + decodeURIComponent(_arguments[0]['res']['request']['url']) + ' HTTP/' + _arguments[0]['res']['raw']['req']['httpVersion'] + '" ' + _arguments[0]['res']['raw']['statusCode'] + ' "' + _arguments[0]['res']['request']['headers']['user-agent'] + '" (' + Math.trunc(_arguments[0]['responseTime']) + 'ms)');
					} else {
						print(inspect(_arguments[0], false, null));
					}

					break;
				}
			}

			print('\n');
		}

		return;
	}

	public fatal(..._arguments: unknown[]): void {
		if(Logger['levelRank']['fatal'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('fatal', _arguments);
		}

		return;
	}

	public error(..._arguments: unknown[]): void {
		if(Logger['levelRank']['error'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('error', _arguments);
		}

		return;
	}

	public warn(..._arguments: unknown[]): void {
		if(Logger['levelRank']['warn'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('warn', _arguments);
		}

		return;
	}

	public info(..._arguments: unknown[]): void {
		if(Logger['levelRank']['info'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('info', _arguments);
		}

		return;
	}

	public debug(..._arguments: unknown[]): void {
		if(Logger['levelRank']['debug'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('debug', _arguments);
		}

		return;
	}

	public trace(..._arguments: unknown[]): void {
		if(Logger['levelRank']['trace'] <= Logger['levelRank'][process['env']['LOG_LEVEL']]) {
			Logger.log('trace', _arguments);
		}

		return;
	}

	public silent(): void {
		return;
	}

	public child(): FastifyBaseLogger {
		return this;
	}
}