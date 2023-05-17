import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export const prisma: PrismaClient = new PrismaClient(process['env']['DATABASE_URL']);

export const redis: Redis = new Redis(process['env']['CACHE_DATABASE_URL']);