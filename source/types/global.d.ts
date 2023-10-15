import { REQUIRED_ENVIRONMENT_VARIABLE_NAMES } from '@library/constant';
import { LogLevel } from 'fastify';

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Record<typeof REQUIRED_ENVIRONMENT_VARIABLE_NAMES[number], string> {
			NODE_ENV: 'development' | 'production';
			LOG_LEVEL: LogLevel;
			JSON_WEB_TOKEN_SECRET: string;
		}
	}
}