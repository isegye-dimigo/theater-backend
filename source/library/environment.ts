import 'dotenv/config';
import { randomBytes } from 'crypto';

export const REQUIRED_ENVIRONMENT_VARIABLE_NAMES = ['DATABASE_URL', 'CACHE_DATABASE_URL', 'SEARCH_DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_HOST', 'EMAIL_PORT', 'PORT', 'RATE_LIMIT', 'PBKDF2_ITERATION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME', 'AWS_CLOUDFRONT_URL'] as const;

for(let i: number = 0; i < REQUIRED_ENVIRONMENT_VARIABLE_NAMES['length']; i++) {
	if(typeof(process['env'][REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i]]) === 'undefined') {
		throw new Error(REQUIRED_ENVIRONMENT_VARIABLE_NAMES[i] + ' must be configured');
	}
}

process['env']['LOG_LEVEL'] ||= 'silent';

switch(process['env']['LOG_LEVEL']) {
	case 'fatal':
	case 'error':
	case 'warn':
	case 'info':
	case 'debug':
	case 'trace':
	case 'silent': {
		break;
	}

	default: {
		throw new Error('LOG_LEVEL must be valid');
	}
}

process['env']['PORT'] ||= '80';

process['env']['TZ'] = 'UTC';

process['env']['JSON_WEB_TOKEN_SECRET'] = process['env']['NODE_ENV'] === 'production' ? randomBytes(64).toString('hex') : '김지훈빡빡이';