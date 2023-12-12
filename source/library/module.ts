import { join } from 'path/posix';
import { Method, Request, Response, Route } from '@library/type';
import Server from '@library/server';
import rateLimit from '@handlers/rateLimit';
import adminHandler from '@handlers/admin';

export default class Module {
	public static paths: Set<string> = new Set<string>();
	private routes: (Route & {
		method: Method;
		path: string;
	})[];
	private prefix: string;
	private modules: Module[];
	private static readonly methods: Method[] = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];

	constructor(routes: Module['routes'], prefix: Module['prefix'] = '/', modules: Module['modules'] = []) {
		this['routes'] = routes;
		this['prefix'] = prefix;
		this['modules'] = modules;
	}

	public static getRouteTree(server: Server): string {
		let routeTree: string = '';

		for(const path of Module['paths']) {
			routeTree += '\n' + path;

			const methods: Method[] = [];

			for(let i: number = 0; i < Module['methods']['length']; i++) {
				if(server['router'].find(Module['methods'][i], path) !== null) {
					methods.push(Module['methods'][i]);
				}
			}

			routeTree += ' (' + methods.join(', ') + ')';
		}

		return routeTree.slice(1);
	}

	public appendPrefix(prefix: string): void {
		this['prefix'] = join(prefix, this['prefix']);

		return;
	}

	public register(server: Server): void {
		for(let i: number = 0; i < this['routes']['length']; i++) {
			const path: string = join(this['prefix'], this['routes'][i]['path']);
			
			if(!Module['paths'].has(path)) {
				Module['paths'].add(path);

				server.register('OPTIONS', path, {
					handlers: [function (request: Request, response: Response): void {
						response.send(null);

						return;
					}]
				});
			}

			if(this['routes'][i]['handlers'][0] !== adminHandler) {
				this['routes'][i]['handlers'].unshift(rateLimit);
			}

			server.register(this['routes'][i]['method'], path, {
				handlers: this['routes'][i]['handlers'],
				schema: this['routes'][i]['schema']
			});
		}

		for(let i: number = 0; i < this['modules']['length']; i++) {
			this['modules'][i].appendPrefix(this['prefix']);
			this['modules'][i].register(server);
		}

		return;
	}
}