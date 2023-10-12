import { FastifyRequest } from 'fastify';
import { ContentTypeParserDoneFunction } from 'fastify/types/content-type-parser';
import { IncomingMessage } from 'http';

export default function contentTypeParser(request: FastifyRequest, payload: IncomingMessage, done: ContentTypeParserDoneFunction): void {
	// @ts-expect-error
	done();

	return;
}