import { REPORT_TYPES } from '@library/constant';
import { Request, Response } from '@library/type';

export default function (request: Request, response: Response): void {
	response.send(REPORT_TYPES);

	return;
}