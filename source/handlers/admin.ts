import JsonWebToken from '@library/jsonWebToken';
import { DoneFuncWithErrOrRes, FastifyRequest, FastifyReply } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		let jsonWebToken: JsonWebToken;

		try {
			jsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET'])
		} catch {
			reply.callNotFound();

			return;
		}

		if(jsonWebToken.isValid() && (jsonWebToken['payload'] as {
			uid?: number;
		})['uid'] === 0) {
			done();

			return;
		}
	}

	reply.callNotFound();

	return;
}