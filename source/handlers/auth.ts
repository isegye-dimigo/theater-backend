import JsonWebToken from '@library/jsonWebToken';
import { BadRequest } from '@library/httpError';
import { DoneFuncWithErrOrRes, FastifyRequest, FastifyReply } from 'fastify';

export default function authHandler(request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		const jsonWebToken: JsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET']);

		if(jsonWebToken.isValid()) {
			request['userId'] = (jsonWebToken['payload'] as Record<string, any>)['id'];

			done();
		} else {
			reply.send(new BadRequest('Invalid authorization value'));
		}
	} else {
		reply.send(new BadRequest('Invalid authorization type'));
	}

	return;
}