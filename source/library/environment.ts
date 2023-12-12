import 'dotenv/config';
import { randomBytes } from 'crypto';
import { ENVIRONMENT_VARIABLE_NAMES } from '@library/constant';

for(let i: number = 0; i < ENVIRONMENT_VARIABLE_NAMES['length']; i++) {
	if(typeof(process['env'][ENVIRONMENT_VARIABLE_NAMES[i]]) === 'undefined') {
		throw new Error(ENVIRONMENT_VARIABLE_NAMES[i] + ' must be configured');
	}
}

switch(process['env']['LOG_LEVEL']) {
	case 'fatal':
	case 'error':
	case 'warn':
	case 'info':
	case 'debug':
	case 'trace': {
		break;
	}

	default: {
		throw new Error('LOG_LEVEL must be valid');
	}
}

process['env']['PORT'] ||= '80';

process['env']['TZ'] = 'UTC';

process['env']['JSON_WEB_TOKEN_SECRET'] = process['env']['NODE_ENV'] === 'production' ? randomBytes(64).toString('hex') : '김지훈빡빡이';