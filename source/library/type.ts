import { FastifyBaseLogger, FastifySchema, FastifyTypeProvider, HTTPMethods, RouteHandlerMethod, RouteOptions as _RouteOptions } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import Module from '@library/module';
import { JSONSchema } from 'fluent-json-schema';

type RecursiveRecord<T extends string | number | symbol, S> = {
	[key in T]: S | RecursiveRecord<T, S>
};

export type SchemaKey = 'body' | 'querystring' | 'params' | 'headers';

export interface RouteOptions extends Omit<_RouteOptions, 'handler' | 'schema'> {
	method: HTTPMethods;
	handler: RouteHandlerMethod<Server, IncomingMessage, ServerResponse, any, any, FastifySchema, FastifyTypeProvider, FastifyBaseLogger>;
	schema?: Partial<Pick<RecursiveRecord<string, | Partial<Record<'$isRequired', boolean>> | Omit<Record<string, JSONSchema>, '$isRequired'>>, SchemaKey>>;
	excludePreHandler?: boolean;
}

export interface ModuleOptions {
	routers: RouteOptions[];
	modules?: Module[];
	prefix?: string;
}

export type JsendResponse = {
	status: 'success'
	data: RecursiveRecord<string, any> | null
} | {
	status: 'error'
	message: string
} | {
	status: 'fail'
	data: {
		title: string
		body?: string
	}
};

export type ResolveFunction<T = void> = (value: T) => void;

export type RejectFunction = (error: any) => void;