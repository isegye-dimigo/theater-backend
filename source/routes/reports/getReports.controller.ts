import { reportTypes } from '@library/utility';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send(reportTypes);

	return;
}