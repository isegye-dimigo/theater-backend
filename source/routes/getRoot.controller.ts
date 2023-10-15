import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send({
		message: 'JiHoon Kim wants to go to the isegye'
	});

	return;
}