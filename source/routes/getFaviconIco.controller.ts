import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.setStatus(204);
	response.send();

	return;
}