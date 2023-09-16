import { ModuleOptions, RouteOptions, SchemaKey } from '@library/type';
import { FastifyInstance, preHandlerHookHandler as PreHandlerHookHandler } from 'fastify';
import { NullSchema, ObjectSchema } from 'fluent-json-schema';
import { join } from 'path/posix';
import schemaErrorFormatHandler from '../handlers/schemaErrorFormat';
import { Schema } from './schema';
import authHandler from '../handlers/auth';
import optionsHandler from '../handlers/options';

export default class Module {
	public static registeredUrl: Set<string> = new Set<string>();
	private options: ModuleOptions;

	constructor(options: ModuleOptions) {
		if(options['prefix']['length'] === 0) {
			options['prefix'] = '/';
		}

		this['options'] = options;

		return;
	}

	public appendPrefix(prefix: string): void {
		this['options']['prefix'] = join(prefix, this['options']['prefix']);

		return;
	}

	public register(fastifyInstance: FastifyInstance): void {
		for(let i: number = 0; i < this['options']['routers']['length']; i++) {
			let _schema: Partial<Record<SchemaKey, ObjectSchema | NullSchema>> | undefined;

			if(typeof(this['options']['routers'][i]['schema']) === 'object') {
				_schema = {};

				const keys: SchemaKey[] = Object.getOwnPropertyNames(this['options']['routers'][i]['schema']) as SchemaKey[];

				for(let j: number = 0; j < keys['length']; j++) {
					_schema[keys[j]] = Schema.getObjectSchema((this.options.routers[i].schema as Required<Required<RouteOptions>['schema']>)[keys[j]]);
				}
			}

			if(Array.isArray(this['options']['routers'][i]['preHandler']) && this['options']['routers'][i]['isAuthNeeded'] === true) {
				(this['options']['routers'][i]['preHandler'] as PreHandlerHookHandler[]).unshift(authHandler);
			}

			const url: string = join(fastifyInstance['prefix'], this['options']['prefix'], this['options']['routers'][i]['url']);
			switch(this['options']['routers'][i]['method']) {
				case 'POST':
				case 'PATCH':
				case 'DELETE': {
					if(!Module['registeredUrl'].has(url)) {
						Module['registeredUrl'].add(url);

						fastifyInstance.route({
							method: 'OPTIONS',
							url: url,
							handler: optionsHandler
						});
					}

					break;
				}
			}

			if(this['options']['routers'][i]['isAuthNeeded'] === true) {
				switch(typeof(this['options']['routers'][i]['preHandler'])) {
					case 'function': {
						this['options']['routers'][i]['preHandler'] = [authHandler, this['options']['routers'][i]['preHandler'] as PreHandlerHookHandler];

						break;
					}

					case 'object': {
						if(Array.isArray(this['options']['routers'][i]['preHandler'])) {
							(this['options']['routers'][i]['preHandler'] as PreHandlerHookHandler[]).unshift(authHandler);

							break;
						}
					}

					default: {
						this['options']['routers'][i]['preHandler'] = authHandler;

						break;
					}
				}
			}

			fastifyInstance.route(Object.assign(this['options']['routers'][i], {
				url: url,
				schema: _schema,
				schemaErrorFormatter: schemaErrorFormatHandler
			}));
		}

		for(let i: number = 0; i < this['options']['modules']['length']; i++) {
			this['options']['modules'][i].appendPrefix(this['options']['prefix']);
			this['options']['modules'][i].register(fastifyInstance);
		}

		return;
	}
}