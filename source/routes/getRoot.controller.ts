import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send({
		message: 'Ji Hoon Kim wants to go to the isegye'
	});

	return;
}