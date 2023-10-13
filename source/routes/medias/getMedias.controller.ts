import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send({
		baseUrl: process['env']['MEDIA_SERVER_URL']
	});

	return;
}