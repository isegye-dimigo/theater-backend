import '@library/environment';
import '@library/schedule';
import Logger from '@library/logger';
import fastify, { FastifyInstance } from 'fastify';
import errorHandler from './handlers/error';
import headerHandler from './handlers/header';
import notFoundHandler from './handlers/notFound';
import serializeHandler from './handlers/serialize';
import rootModule from './routes/root.module';
import fastifyMultipart from '@fastify/multipart';
import JsonWebToken from '@library/jsonWebToken';

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

fastifyInstance.register(fastifyMultipart, {
	throwFileSizeLimit: true,
	limits: {
		files: 1,
		fileSize: 2147000000
	}
});

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

	fastifyInstance['log'].debug('accessToken: ' + JsonWebToken.create({
		uid: 0,
		hdl: '',
		vrf: true,
		exp: Number['MAX_SAFE_INTEGER']
	}, process['env']['JSON_WEB_TOKEN_SECRET']));

	return;
})
.catch(fastifyInstance['log'].fatal);