import { FastifyRequest, FastifyReply } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send(null);

	return;
}