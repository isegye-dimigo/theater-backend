import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.send({
		baseUrl: process['env']['STORAGE_URL']
	});

	return;
}