import { FastifyBaseLogger, FastifyInstance as _FastifyInstance, FastifySchema, FastifyTypeProvider, HTTPMethods, RouteHandlerMethod, RouteOptions as _RouteOptions } from 'fastify';
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
	isAuthNeeded?: boolean;
}

export interface ModuleOptions {
	routers: RouteOptions[];
	modules: Module[];
	prefix: string;
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

export interface PageQuery {
	'page[size]': number;
	'page[index]': number;
	'page[order]': 'desc' | 'asc';
}

export interface FileSignature {
	offsetByte: number;
	buffer: Buffer;
}

export type FileType = 'mp4' | 'jpg' | 'png';

export type Metadata<T extends 'video' | 'image'> = T extends 'video' ? {
	video: {
		width: number;
		height: number;
		aspectRatio: string;
		frameRate: number;
		bitRate: number;
	};

	audio: {
		channelCount: number;
		sampleRate: number;
		bitRate: number;
	};

	index: number;
	duration: number;
	size: number;
	bitRate: number;
} : {
	video: {
		width: number;
		height: number;
		aspectRatio: string;
	};

	size: number;
};

export type FastifyInstance = _FastifyInstance<Server, IncomingMessage, ServerResponse, any, any>;