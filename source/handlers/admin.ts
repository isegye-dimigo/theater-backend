import { NotFound } from '@library/error';
import JsonWebToken from '@library/jsonWebToken';
import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		try {
			const jsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET']);
			
			if(jsonWebToken.isValid() && (jsonWebToken['payload'] as {
				uid?: number;
			})['uid'] === 0) {
				return;
			}
		} catch {}
	}

	throw new NotFound('Page not found');
}