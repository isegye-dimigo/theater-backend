import { Method, Route } from '@library/type';

type Tree = Map<typeof Router['treeRoute'], Route> & Map<typeof Router['treeAll'] | typeof Router['treeParameter'] | string, Tree> & Map<typeof Router['treeName'], string>;

export default class Router {
	public tree: Map<Method, Tree>;
	private static readonly treeAll: unique symbol = Symbol('all');
	private static readonly treeParameter: unique symbol = Symbol('parameter');
	private static readonly treeName: unique symbol = Symbol('name');
	private static readonly treeRoute: unique symbol = Symbol('route');

	constructor() {
		this['tree'] = new Map([['GET', new Map()], ['POST', new Map()], ['PATCH', new Map()], ['DELETE', new Map()], ['OPTIONS', new Map()]]);
	}

	public register(method: Method, path: string, route: Route): void {
		let tree: Tree = this['tree'].get(method) as Tree;
		
		if(path.startsWith('/')) {
			if(path !== '/') {
				let lastSlashIndex: number = 1;

				while(lastSlashIndex !== 0) {
					const currentSlashIndex: number = path.indexOf('/', lastSlashIndex);
					let treePath: typeof Router['treeAll'] | typeof Router['treeParameter'] | string = path.slice(lastSlashIndex, currentSlashIndex !== -1 ? currentSlashIndex : undefined);
					let targetTree: Tree | undefined = tree.get(treePath);

					lastSlashIndex = currentSlashIndex + 1;

					if(typeof(targetTree) !== 'object') {
						if(treePath.startsWith(':')) {
							targetTree = tree.get(Router['treeParameter']);

							if(typeof(targetTree) !== 'object') {
								targetTree = new Map([[Router['treeName'], treePath.slice(1)]]) as Tree;

								tree.set(Router['treeParameter'], targetTree);
							} else if(targetTree.get(Router['treeName']) !== treePath.slice(1)) {
								throw new Error('Parameter');
							}
						} else if(treePath === '*') {
							targetTree = tree.get(Router['treeAll']);

							if(typeof(targetTree) !== 'object') {
								targetTree = new Map();
								
								tree.set(Router['treeAll'], targetTree);
							}
						} else {
							targetTree = new Map();
							
							tree.set(treePath, targetTree);
						}
					}

					tree = targetTree;
				}
			}
		} else {
			throw new Error('Start');
		}

		if(typeof(tree.get(Router['treeRoute'])) === 'undefined') {
			tree.set(Router['treeRoute'], route);

			return;
		} else {
			throw new Error('Path');
		}
	}

	public find(method: Method, path: string, parameter: Record<string, unknown> = {}): [Route, Record<string, unknown>] | null {
		let tree: Tree = this['tree'].get(method) as Tree;
		
		if(path !== '/') {
			if(!path.endsWith('/')) {
				let lastSlashIndex: number = 1;
				let lastAllTree: Tree | undefined;

				while(lastSlashIndex !== 0) {
					const currentSlashIndex: number = path.indexOf('/', lastSlashIndex);
					const treePath: string = path.slice(lastSlashIndex, currentSlashIndex !== -1 ? currentSlashIndex : undefined);
					let targetTree: Tree | undefined = tree.get(treePath);

					if(typeof(lastAllTree) !== 'object') {
						lastAllTree = tree.get(Router['treeAll']);

						if(typeof(lastAllTree) === 'object' && typeof(lastAllTree.get(Router['treeRoute'])) !== 'object') {
							lastAllTree = undefined;
						}
					}

					if(typeof(targetTree) !== 'object') {
						targetTree = tree.get(Router['treeParameter']);

						if(typeof(targetTree) === 'object') {
							parameter[targetTree.get(Router['treeName']) as string] = treePath;
						} else {
							targetTree = tree.get(Router['treeAll']);
							
							if(typeof(targetTree) !== 'object') {
								if(typeof(lastAllTree) === 'object') {
									tree = lastAllTree;

									break;
								} else {
									return null;
								}
							} else {
								lastAllTree = targetTree;
							}
						}
					}
					
					tree = targetTree;
					lastSlashIndex = currentSlashIndex + 1;
				}
			} else {
				return null;
			}
		}

		const route: Route | undefined = tree.get(Router['treeRoute']);

		if(typeof(route) === 'object') {
			return [route, parameter];
		} else {
			return null;
		}
	}
}