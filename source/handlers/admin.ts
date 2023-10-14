import { NotFound } from '@library/httpError';
import JsonWebToken from '@library/jsonWebToken';
import { DoneFuncWithErrOrRes, FastifyRequest, FastifyReply } from 'fastify';

export default function adminHandler(request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		const jsonWebToken: JsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET']);

		if(jsonWebToken.isValid() && (jsonWebToken['payload'] as {
			uid?: number;
		})['uid'] === 0) {
			done();

			return;
		}
	}

	done(new NotFound('Page not found'));

	return;
}