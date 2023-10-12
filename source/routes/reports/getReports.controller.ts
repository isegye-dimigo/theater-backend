import { reportTypes } from '@library/constant';
import { FastifyReply, FastifyRequest } from 'fastify';

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send(reportTypes);

	return;
}