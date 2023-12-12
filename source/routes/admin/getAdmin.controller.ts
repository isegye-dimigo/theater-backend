import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.send([0]);

	return;
}