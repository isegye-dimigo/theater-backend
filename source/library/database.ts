import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export const prisma: PrismaClient = new PrismaClient();

export const redis: Redis = new Redis(process['env']['CACHE_DATABASE_URL']);

export function getPagenation(query: PageQuery): {
	skip: number,
	take: number,
	orderBy: {
		id: 'asc' | 'desc'
	}
} {
	return {
		skip: query['page[size]'] * query['page[index]'],
		take: query['page[size]'],
		orderBy: {
			id: query['page[order]'] === 'asc' ? 'asc' : 'desc'
		}
	};
}