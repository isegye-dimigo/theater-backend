import { CATEGORYS } from '@library/constant';
import { Request, Response } from '@library/type';

export default function <T extends keyof typeof CATEGORYS = keyof typeof CATEGORYS>(request: Request, response: Response): void {
	const categorys: {
		id: T;
		title: typeof CATEGORYS[T];
	}[] = [];

	for(const id in CATEGORYS) {
		categorys.push({
			id: Number(id) as T,
			title: CATEGORYS[id as unknown as T]
		});
	}

	response.send(categorys);

	return;
}