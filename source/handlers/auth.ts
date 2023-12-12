import JsonWebToken from '@library/jsonWebToken';
import { BadRequest } from '@library/error';
import { Request } from '@library/type';

export default function (request: Request): void {
	if(typeof(request['headers']['authorization']) === 'string' && request['headers']['authorization'].startsWith('Bearer ')) {
		try {
			const jsonWebToken: JsonWebToken = new JsonWebToken(request['headers']['authorization'].slice(7), process['env']['JSON_WEB_TOKEN_SECRET']);
			
			if(jsonWebToken.isValid()) {
				request['user'] = {
					id: (jsonWebToken['payload'] as {
						uid: number;
					})['uid'],
					isVerified: (jsonWebToken['payload'] as {
						vrf: boolean;
					})['vrf']
				};

				return;
			} else {
				throw new BadRequest('Header[\'authorization\'] value must be valid');
			}
		} catch {
			throw new BadRequest('JsonWebToken payload must be valid');
		}
	} else {
		throw new BadRequest('Header[\'authorization\'] type must be valid');
	}
}