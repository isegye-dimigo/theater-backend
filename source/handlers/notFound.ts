import { NotFound } from '@library/httpError';
import { FastifyRequest, FastifyReply } from 'fastify'

export default function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
	reply.send(new NotFound('Page not found'));

	return;
}