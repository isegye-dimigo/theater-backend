import '@library/environment';
import Logger from '@library/logger';
import fastify, { FastifyInstance } from 'fastify';
import errorHandler from './handlers/error';
import headerHandler from './handlers/header';
import notFoundHandler from './handlers/notFound';
import serializeHandler from './handlers/serialize';
import rootModule from './routes/root.module';

const fastifyInstance: FastifyInstance = fastify({
	trustProxy: true,
	exposeHeadRoutes: false,
	logger: new Logger()
});

fastifyInstance['server']['requestTimeout'] = 0;
fastifyInstance['server']['headersTimeout'] = 0;

fastifyInstance.setNotFoundHandler(notFoundHandler);
fastifyInstance.setErrorHandler(errorHandler);
fastifyInstance.setReplySerializer(serializeHandler);
fastifyInstance.addHook('preHandler', headerHandler);

rootModule.register(fastifyInstance);

fastifyInstance.listen({
	host: '0.0.0.0',
	port: Number.parseInt(process['env']['PORT'], 10)
})
.then(function (): void {
	fastifyInstance['log'].info('Route tree:');

	const routeLines: string[] = fastifyInstance.printRoutes({ commonPrefix: false }).split(/^(└──\s|\s{4})/gm).slice(2);

	for(let i: number = 0; i < routeLines['length']; i++) {
		if(i % 2 === 0) {
			fastifyInstance['log'].info(routeLines[i].replace('\n', ''));
		}
	}

	return;
})
.catch(fastifyInstance['log'].fatal);