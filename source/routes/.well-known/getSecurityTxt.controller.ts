import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.send('Contact: mailto:me@kangmin.kim\nContact: mailto:kkm@isegye.kr\nExpires: ' + ((new Date()).getFullYear() + 1) + '-01-01T00:00:00.000Z\nPreferred-Languages: ko, en\nCanonical: https://api.isegye.kr/.well-known/security.txt');

	return;
}