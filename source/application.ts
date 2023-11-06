import '@library/environment';
import '@library/schedule';
import fastify from 'fastify';
import { FastifyInstance } from '@library/type';
import { logger } from '@library/logger';
import errorHandler from '@handlers/error';
import headerHandler from '@handlers/header';
import notFoundHandler from '@handlers/notFound';
import serializeHandler from '@handlers/serialize';
import rateLimitHandler from '@handlers/rateLimit';
import multipartContentTypeParser from '@handlers/multipartContentTypeParser';
import rootModule from './routes/root.module';
import JsonWebToken from '@library/jsonWebToken';
import Module from '@library/module';

const fastifyInstance: FastifyInstance = fastify({
	trustProxy: true,
	exposeHeadRoutes: false,
	logger: logger
});

fastifyInstance['server']['requestTimeout'] = 0;
fastifyInstance['server']['headersTimeout'] = 0;

fastifyInstance.setNotFoundHandler(notFoundHandler);
fastifyInstance.setErrorHandler(errorHandler);
fastifyInstance.setReplySerializer(serializeHandler);
fastifyInstance.addHook('preHandler', headerHandler);
fastifyInstance.addHook('onRequest', rateLimitHandler);
fastifyInstance.addContentTypeParser('multipart/form-data', multipartContentTypeParser);

rootModule.register(fastifyInstance);

fastifyInstance.listen({
	host: '0.0.0.0',
	port: Number.parseInt(process['env']['PORT'], 10)
})
.then(function (): void {
	fastifyInstance['log'].info('Route tree:');

	const routeLines: string[] = fastifyInstance.printRoutes({
		commonPrefix: false
	}).split(/^(└──\s|\s{4})/gm).slice(2);

	for(let i: number = 0; i < routeLines['length']; i++) {
		if(i % 2 === 0) {
			fastifyInstance['log'].info(routeLines[i].replace('\n', ''));
		}
	}

	logger.info('accessToken: ' + JsonWebToken.create({
		uid: 0,
		hdl: '#',
		vrf: true
	}, process['env']['JSON_WEB_TOKEN_SECRET']));

	return;
})
.catch(fastifyInstance['log'].fatal.bind(fastifyInstance['log']));