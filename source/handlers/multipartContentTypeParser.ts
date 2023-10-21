import { UnsupportedMediaType } from '@library/httpError';
import { FastifyRequest } from 'fastify';
import { ContentTypeParserDoneFunction } from 'fastify/types/content-type-parser';
import { IncomingMessage } from 'http';

export default function (request: FastifyRequest, payload: IncomingMessage, done: ContentTypeParserDoneFunction): void {
	done(request['routeOptions']['url'] === '/medias' && request['routeOptions']['method'] === 'POST' ? null : new UnsupportedMediaType('Unsupported Media Type: ' + request['headers']['content-type']));

	return;
}