import { Server as _Server } from 'http';
import { UrlWithParsedQuery, parse } from 'url';
import { promisify } from 'util';
import { GenericKey, Handler, Method, Request, Response, Route, Schema } from '@library/type';
import { BadRequest, HttpError, MethodNotAllowed, NotFound, PayloadTooLarge, Unauthorized, UnsupportedMediaType, ValidationError } from '@library/error';
import Router from '@library/router';
import Logger from '@library/logger';
import { SchemaType } from '@library/constant';
import Busboy, { BusboyFileStream, BusboyHeaders } from '@fastify/busboy';
import { Hash, createHash } from 'crypto';
import authHandler from '@handlers/auth';
import { isValidType } from '@library/utility';
import { WriteStream, createWriteStream } from 'fs';
import { join } from 'path/posix';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

export default class Server extends _Server {
	public logger: Logger = Logger['logger'];
	private isProxied: boolean;
	private router: Router;

	private static redirect(this: Response, url: string, code?: number): void {
		this['statusCode'] = typeof(code) === 'number' ? code : 307;
		this.setHeader('location', url);
		this.send();

		return;
	}

	private static setStatus(this: Response, code: number): void {
		this['statusCode'] = code;

		return;
	}

	private static send(this: Response, data?: unknown, isFormatted: boolean = false): void {
		if(!this['writableEnded']) {
			if(typeof(data) === 'object') {
				isFormatted = true;
				
				if(data instanceof Error) {
					this.setStatus(data instanceof HttpError ? data['statusCode'] : data instanceof ValidationError ? 400 : 500);
	
					const isClientError: boolean = this['statusCode'] < 500;
					
					if(!isClientError) {
						let lastNewLineIndex: number = 0;
						
						while(lastNewLineIndex !== -1) {
							const currentNewLineIndex: number = (data['stack'] as string).indexOf('\n', lastNewLineIndex + 1);
	
							this['server']['logger'].warn((data['stack'] as string).slice(lastNewLineIndex, currentNewLineIndex !== -1 ? currentNewLineIndex : undefined).replace('\n', ''));
							
							lastNewLineIndex = currentNewLineIndex;
						}
					}

					data = '{"status":"' + (isClientError ? 'fail","data":{"title":"' + data['message'].replace(/\"/g, '\\"') + '"}' : 'error","code":' + this['statusCode'] + ',"message":"' + data['message'].replace(/\"/g, '\\"') + '"') + '}';
				} else {
					data = '{"status":"success","data":' + JSON.stringify(data) + '}';
				}
			} else if(typeof(data) !== 'undefined' && typeof(data) !== 'string') {
				data = String(data);
			}
			
			if(typeof(data) !== 'undefined') {
				this.setHeader('Content-Type', (isFormatted ? 'application/json' : 'text/plain') + ';charset=utf-8');
				this.setHeader('Content-Length', Buffer.byteLength(data as string));
				this.write(data);
			}

			this.end();
			
			this['server']['logger'].info(this['request']['ip'] + ' "' + this['request']['method'] + ' ' + decodeURIComponent(this['request']['url']) + ' HTTP/' + this['request']['httpVersion'] + '" ' + this['statusCode'] + ' "' + this['request']['headers']['user-agent'] + '" (' + (Date.now() - this['request']['startTime']) + 'ms)');
		} else {
			this['server']['logger'].warn('Send after end');
		}

		return;
	}

	public static validate(schema: Schema, target: unknown, path: string = '', shouldConvertType: boolean = false): unknown {		
		switch(schema['type']) {
			case SchemaType['NUMBER']: {
				shouldConvertType = shouldConvertType === true && typeof(target) !== 'undefined';
				
				if(shouldConvertType) {
					target = Number(target);
				}
	
				if(typeof(target) === 'number') {
					if(Number.isNaN(target)) {
						throw new ValidationError(path, 'be number');
					}

					if(Array.isArray(schema['enum'])) {
						if(!schema['enum'].includes(target)) {
							throw new ValidationError(path, 'be one of ' + JSON.stringify(schema['enum']));
						}
					} else {
						if(schema['isInteger'] === true && !Number.isInteger(target)) {
							throw new ValidationError(path, 'be integer');
						}
		
						if(typeof(schema['maximum']) === 'number' && target > schema['maximum']) {
							throw new ValidationError(path, 'be smaller than ' + schema['maximum']);
						}
		
						if(typeof(schema['minimum']) === 'number' && target < schema['minimum']) {
							throw new ValidationError(path, 'be bigger than ' + schema['minimum']);
						}
					}

					if(shouldConvertType) {
						return target;
					} else {
						return;
					}
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be number');
				}
			}
	
			case SchemaType['STRING']: {
				shouldConvertType = shouldConvertType === true && typeof(target) !== 'undefined';

				if(shouldConvertType) {
					target = String(target);
				}

				if(typeof(target) === 'string') {
					if(Array.isArray(schema['enum'])) {
						if(!schema['enum'].includes(target)) {
							throw new ValidationError(path, 'be one of ' + JSON.stringify(schema['enum']));
						}
					} else if(typeof(schema['pattern']) === 'undefined') {
						if(typeof(schema['maximum']) === 'number' && target['length'] > schema['maximum']) {
							throw new ValidationError(path, 'be shorter than ' + schema['maximum']);
						}
	
						if(typeof(schema['minimum']) === 'number' && target['length'] < schema['minimum']) {
							throw new ValidationError(path, 'be longer than ' + schema['minimum']);
						}
					} else {
						if(!schema['pattern'].test(target)) {
							throw new ValidationError(path, 'match ' + schema['pattern']);
						}
					}

					if(shouldConvertType) {
						return target;
					} else {
						return;
					}
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be string');
				}
			}
	
			case SchemaType['BOOLEAN']: {
				if(shouldConvertType === true) {
					switch(target) {
						case 'true':
						case '1': {
							return true;
						}
	
						case 'false':
						case '0': {
							return false;
						}
	
						case '': {
							target = undefined;
						}
					}
				}
	
				if(typeof(target) === 'boolean') {
					return;
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be boolean');
				}
			}
	
			case SchemaType['NULL']: {
				if(shouldConvertType === true && target === 'null') {
					return null;
				}
	
				if(target === null) {
					return;
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be null');
				}
			}
	
			case SchemaType['OBJECT']: {
				if(typeof(target) === 'object' && target !== null) {
					for(const key in schema['properties']) {
						// @ts-expect-error
						const result: unknown = this.validate(schema['properties'][key], target[key], path + '["' + key.replace(/"/g, '\\"') + '"]', shouldConvertType);
						
						if(typeof(result) !== 'undefined') {
							// @ts-expect-error
							target[key] = result;
						}
					}
	
					if(schema['allowAdditionalProperties'] !== true) {
						for(const key in target) {
							if(typeof(schema['properties'][key]) === 'undefined') {
								throw new ValidationError(path, 'not have additional property');
							}
						}
					}
	
					return;
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be object');
				}
			}
	
			case SchemaType['ARRAY']: {
				if(Array.isArray(target)) {
					if(typeof(schema['maximum']) === 'number' && target['length'] > schema['maximum']) {
						throw new ValidationError(path, 'be shorter than ' + schema['maximum']);
					}
	
					if(typeof(schema['minimum']) === 'number' && target['length'] < schema['minimum']) {
						throw new ValidationError(path, 'be longer than ' + schema['minimum']);
					}

					if(Array.isArray(schema['items'])) {
						for(let i: number = 0; i < target['length']; i++) {
							const result: unknown = this.validate(schema['items'][i], target[i], path + '[' + i + ']', shouldConvertType);
	
							if(typeof(result) !== 'undefined') {
								target[i] = result;
							}
						}
					} else {
						for(let i: number = 0; i < target['length']; i++) {
							const result: unknown = this.validate(schema['items'], target[i], path + '[' + i + ']', shouldConvertType);
	
							if(typeof(result) !== 'undefined') {
								target[i] = result;
							}
						}
					}
	
					return;
				} else if(typeof(target) === 'undefined') {
					if(schema['isOptional'] === true) {
						return schema['default'];
					} else {
						throw new ValidationError(path, 'exist');
					}
				} else {
					throw new ValidationError(path, 'be array');
				}
			}

			case SchemaType['AND']: {
				if(schema['schemas']['length'] > 1) {
					if(typeof(target) !== 'undefined') {
						let _shouldConvertType: boolean = shouldConvertType === true;

						for(let i: number = 0; i < schema['schemas']['length']; i++) {
							const result: unknown = this.validate(schema['schemas'][i], target, path, _shouldConvertType);

							if(typeof(result) !== 'undefined') {
								target = result;
								_shouldConvertType = false;
							}
						}

						if(shouldConvertType === true) {
							return target;
						}
					} else if(schema['isOptional'] !== true) {
						throw new ValidationError(path, 'exist');
					}
					
					return;
				} else {
					throw new ValidationError(path, 'be all of schemas');
				}
			}

			case SchemaType['OR']: {
				if(schema['schemas']['length'] > 1) {
					if(typeof(target) !== 'undefined') {
						for(let i: number = 0; i < schema['schemas']['length']; i++) {
							try {
								const result: unknown = this.validate(schema['schemas'][i], target, path, shouldConvertType);
	
								if(typeof(result) !== 'undefined') {
									return result;
								} else {
									return;
								}
							} catch {};
						}
					} else if(schema['isOptional'] !== true) {
						throw new ValidationError(path, 'exist');
					} else {
						return;
					}
				}

				throw new ValidationError(path, 'be one of schemas');
			}

			case SchemaType['NOT']: {
				if(typeof(target) === 'undefined') {
					try {
						this.validate(schema['schema'], target, path);
					} catch {
						return;
					}
					
					throw new ValidationError(path, 'not be schema');
				} else if(schema['isOptional'] !== true) {
					throw new ValidationError(path, 'exist');
				} else {
					return;
				}
			}
	
			default: {
				throw new Error('Schema must be valid');
			}
		}
	}

	private static requestHandler(handlers: Route['handlers'], request: Request, response: Response): void {
		try {
			handlers.slice(1)
			.reduce(function (promise: Promise<unknown>, handler: Handler): Promise<unknown> {
				return promise.then(function (): Promise<unknown> {
					return Promise.resolve(handler(request, response));
				});
			}, Promise.resolve(handlers[0](request, response)))
			.catch(function (error: Error): void {
				response.send(error);

				return;
			});
		} catch(error: unknown) {
			response.send(error);
		}

		return;
	}

	constructor(options: {
		isProxied?: Server['isProxied'];
	} = {}) {
		// @ts-expect-error
		super(function (this: Server, request: Request, response: Response): void {
			try {
				Object.assign(request, {
					startTime: Date.now(),
					ip: typeof(this['isProxied'] && request['headers']['x-forward-for']) === 'string' ? request['headers']['x-forward-for'] : request['socket']['remoteAddress'],
					server: this,
					header: request['headers']
				});
		
				Object.assign(response, {
					request: request,
					setStatus: Server.setStatus,
					send: Server.send,
					redirect: Server.redirect,
					server: this
				});

				switch(request['method']) {
					case 'POST':
					case 'PATCH':
					case 'DELETE':
					case 'OPTIONS':
					case 'GET': {
						const url: UrlWithParsedQuery = parse(request['url'], true);
						const routerResult: [Route, Record<string, unknown>] | null = this['router'].find(request['method'], url['pathname'] as string);

						if(routerResult !== null) {
							Object.assign(request, {
								query: url['query'],
								parameter: routerResult[1]
							});

							for(const key in routerResult[0]['schema']) {
								if(key !== 'body') {
									for(const _key in request[key as GenericKey] as Record<string, string>) {
										if(typeof((request[key as GenericKey] as Record<string, string>)[_key]) === 'string') {
											(request[key as GenericKey] as Record<string, string>)[_key] = decodeURIComponent((request[key as GenericKey] as Record<string, string>)[_key]);
										}
									}

									if(typeof(routerResult[0]['schema'][key as GenericKey]) !== 'undefined') {
										const validationResult: unknown = Server.validate(routerResult[0]['schema'][key as GenericKey] as Schema, request[key as GenericKey], key[0].toUpperCase() + key.slice(1), true);

										if(typeof(validationResult) !== 'undefined') {
											request[key as GenericKey] = validationResult;
										}
									}
								}
							}

							if(typeof(request['headers']['content-type']) === 'string') {
								switch(request['method']) {
									case 'PATCH':
									case 'POST': {
										let contentType: string = request['headers']['content-type'];
										const endIndex: number = request['headers']['content-type'].indexOf(';');

										if(endIndex !== -1) {
											contentType = contentType.slice(0, endIndex);
										}

										switch(contentType) {
											case 'multipart/form-data': {
												if(url['pathname'] === '/medias') {
													authHandler(request);
			
													mkdtemp(join(tmpdir(), 'isegye-'))
													.then(function (temporaryPath: string): Promise<string> {
														return new Promise<string>(function (resolve: ResolveFunction<string>, reject: RejectFunction): void {
															request.pipe(new Busboy({
																headers: request['headers'] as BusboyHeaders,
																limits: {
																	files: 1
																}
															})
															.on('file', function (fieldName: string, stream: BusboyFileStream, fileName: string, transferEncoding: string, mimeType: string): void {
																const hash: Hash = createHash('sha512').setEncoding('hex');
																let isHeaderChecked: boolean = false;

																// @ts-expect-error
																request['file'] = {
																	path: temporaryPath,
																	//type: '',
																	//hash: '',
																	isVideo: false
																};
				
																switch(mimeType) {
																	case 'video/x-msvideo': {
																		if(request['user']['isVerified']) {
																			request['file']['type'] = 'avi';
																			request['file']['isVideo'] = true;
				
																			break;
																		} else {
																			throw new Unauthorized('User must be verified');
																		}
																	}
				
																	case 'video/mp4': {
																		if(request['user']['isVerified']) {
																			request['file']['type'] = 'mp4';
																			request['file']['isVideo'] = true;
				
																			break;
																		} else {
																			throw new Unauthorized('User must be verified');
																		}
																	}
				
																	case 'image/png': {
																		request['file']['type'] = 'png';
				
																		break;
																	}
				
																	case 'image/jpeg': {
																		request['file']['type'] = 'jpg';
				
																		break;
																	}
				
																	default: {
																		throw new UnsupportedMediaType('File must be valid type');
																	}
																}
			
																const writeStream: WriteStream = createWriteStream(join(temporaryPath, 'input.' + request['file']['type']))
																.once('close', function (): void {
																	resolve(hash.digest('hex'));

																	return;
																})
																.once('error', function (error: Error): void {
																	rm(temporaryPath, {
																		force: true,
																		recursive: true
																	})
																	.then(function (): void {
																		reject(error);
																		
																		return;
																	})
																	.catch(reject);
											
																	return;
																});
																
																if(Number(request['headers']['content-length'] as string) <= (request['file']['isVideo'] ? 21470000000 : 5243000)) {
																	stream.on('data', function (chunk: Buffer): void {
																		if(!stream['destroyed'] && !writeStream['destroyed']) {
																			hash.update(chunk);
	
																			if(!isHeaderChecked) {
																				if(isValidType(chunk, request['file']['type'])) {
																					isHeaderChecked = true;
																				} else {
																					stream.unpipe(writeStream);
																					writeStream.destroy(new UnsupportedMediaType('File must be valid type'));
																				}
																			}
																		} else {
																			stream.unpipe(writeStream);
																			writeStream.destroy(new BadRequest('Request destroyed'));
																		}
																		
																		return;
																	})
																	.once('error', function (error: Error): void {
																		stream.unpipe(writeStream);
																		writeStream.destroy(error);
												
																		return;
																	})
																	.pipe(writeStream);
																} else {
																	reject(new PayloadTooLarge('File must not exceed size limit'));
																}
			
																return;
															}));
			
															return;
														});
													})
													.then(function (hash: string): void {
														request['file']['hash'] = hash;

														Server.requestHandler(routerResult[0]['handlers'], request, response);
														
														return;
													})
													.catch(function (error: unknown): void {
														response.send(error);
			
														return;
													});
			
													break;
												} else {
													throw new UnsupportedMediaType('Header[\'Content-Type\'] must be valid');
												}
											}
											
											case 'application/json': {
												const buffers: Buffer[] = [];

												request.on('data', function (buffer: Buffer): void {
													buffers.push(buffer);
		
													return;
												})
												.on('end', function (): void {
													try {
														request['body'] = JSON.parse(Buffer.concat(buffers).toString());

														if(typeof(routerResult[0]['schema']) !== 'undefined' && typeof(routerResult[0]['schema']['body']) !== 'undefined') {
															const validationResult: unknown = Server.validate(routerResult[0]['schema']['body'], request['body'], 'Body', false);
														
															if(typeof(validationResult) !== 'undefined') {
																request['body'] = validationResult;
															}
														}
	
														Server.requestHandler(routerResult[0]['handlers'], request, response);
													} catch(error: unknown) {
														response.send(error instanceof SyntaxError ? new ValidationError('Body', 'valid') : error);
													}

													return;
												});
			
												break;
											}
			
											default: {
												throw new UnsupportedMediaType('Header[\'Content-Type\'] must be valid');
											}
										}

										break;
									}

									default: {
										throw new UnsupportedMediaType('Body must not be exist');
									}
								}
							} else {
								if(typeof(routerResult[0]['schema']) !== 'undefined' && typeof(routerResult[0]['schema']['body']) !== 'undefined') {
									const validationResult: unknown = Server.validate(routerResult[0]['schema']['body'], request['body'], 'Body', false);
								
									if(typeof(validationResult) !== 'undefined') {
										request['body'] = validationResult;
									}
								}

								Server.requestHandler(routerResult[0]['handlers'], request, response);
							}

							break;
						} else {
							throw new NotFound('Page not found');
						}
					}
					
					default: {
						throw new MethodNotAllowed('Method must be valid');
					}
				}
			} catch(error: unknown) {
				response.send(error);
			}

			return;
		});
		this['router'] = new Router();
		this['isProxied'] = options['isProxied'] === true;
		this['requestTimeout'] = 0;
		this['timeout'] = 0;
	}

	public register(method: Method, path: string, route: Route): void {
		this['router'].register(method, path, route);

		return;
	}

	// @ts-expect-error
	public listen(port: number): Promise<void> {
		// @ts-expect-error
		return promisify(super.listen.bind(this))(port, '0.0.0.0');
	}

	// @ts-expect-error
	public close(): Promise<void> {
		return promisify(super.close.bind(this))();
	}
}