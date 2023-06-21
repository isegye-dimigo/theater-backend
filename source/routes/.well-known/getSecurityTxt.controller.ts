import { FastifyRequest, FastifyReply } from 'fastify'

export default function (request: FastifyRequest, reply: FastifyReply): void {
	reply.send('Contact: mailto:h2o@h2owr.xyz\nExpires: ' + ((new Date()).getFullYear() + 1) + '-01-01T00:00:00.000Z\nPreferred-Languages: ko, en\nCanonical: https://api.isegye.kr/.well-known/security.txt');

	return;
}