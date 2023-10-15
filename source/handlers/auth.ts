import JsonWebToken from '@library/jsonWebToken';
import { BadRequest } from '@library/httpError';
import { DoneFuncWithErrOrRes, FastifyRequest, FastifyReply } from 'fastify';

export default function authHandler(request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		let jsonWebToken: JsonWebToken;

		try {
			jsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET'])
		} catch {
			done(new BadRequest('JsonWebToken payload must be valid'));

			return;
		}

		if(jsonWebToken.isValid()) {
			request['user'] = {
				id: (jsonWebToken['payload'] as {
					uid: number;
				})['uid'],
				handle: (jsonWebToken['payload'] as {
					hdl: string;
				})['hdl'],
				isVerified: (jsonWebToken['payload'] as {
					vrf: boolean;
				})['vrf']
			};

			done();
		} else {
			done(new BadRequest('Header[\'authorization\'] value must be valid'));
		}
	} else {
		done(new BadRequest('Header[\'authorization\'] type must be valid'));
	}

	return;
}