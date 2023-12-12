import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.send({
		message: 'JiHoon Kim wants to go to the isegye'
	});

	return;
}