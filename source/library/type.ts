import { FastifyBaseLogger, FastifyInstance as _FastifyInstance, FastifySchema, FastifyTypeProvider, HTTPMethods, RouteHandlerMethod, RouteOptions as _RouteOptions } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import Module from '@library/module';
import { ArraySchema, BooleanSchema, IntegerSchema, JSONSchema, NullSchema, NumberSchema, ObjectSchema, StringSchema } from 'fluent-json-schema';
import { fileSignatures } from '@library/constant';

type RecursiveRecord<T extends string | number | symbol, S> = {
	[key in T]: S | RecursiveRecord<T, S>
};

export type FastifyInstance = _FastifyInstance<Server, IncomingMessage, ServerResponse, any, any>;

export type Schema<T extends {}> = Record<keyof T, ObjectSchema | StringSchema | NumberSchema | ArraySchema | IntegerSchema | BooleanSchema | NullSchema>;

export type SchemaKey = 'body' | 'querystring' | 'params' | 'headers';

export interface RouteOptions extends Omit<_RouteOptions, 'handler' | 'schema'> {
	method: Uppercase<HTTPMethods>;
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
	status: 'success';
	data: RecursiveRecord<string, any> | null;
} | {
	status: 'error';
	code?: number;
	message: string;
} | {
	status: 'fail';
	data: {
		title: string;
		body?: string;
	};
};

export type ResolveFunction<T = void> = (value: T) => void;

export type RejectFunction = (error: any) => void;

export interface PageQuery {
	'page[size]': number;
	'page[index]': number;
	'page[order]': 'desc' | 'asc';
}

export interface File {
	path: string;
	type: keyof typeof fileSignatures;
	isVideo: boolean;
	hash: string;
}

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

export type RawSeries = {
	created_at: Date;
	user_is_verified: boolean;
} & Record<'id' | 'user_id' | 'media_id', BigInt> & Record<'title' | 'description' | 'user_handle' | 'user_name' | 'media_hash', string> & Record<'media_width' | 'media_height', number>;

export type RawSeriesMovie = {
	movie_created_at: Date;
	movie_user_is_verified: boolean;
} & Record<'id' | 'series_id' | 'movie_id' | 'movie_user_id' | 'movie_image_media_id', BigInt> & Record<'subtitle' | 'movie_title' | 'movie_user_handle' | 'movie_user_name' | 'movie_image_media_hash', string> & Record<'index' | 'movie_image_media_width' | 'movie_image_media_height', number>;

export type RawMovie = {
	created_at: Date;
	user_is_verified: boolean;
} & Record<'id' | 'user_id' | 'image_media_id' | 'category_id' | 'series_movie_id' | 'series_movie_series_id' | 'movie_statistic_like_count', BigInt> & Record<'title' | 'description' | 'user_handle' | 'user_name' | 'image_media_hash' | 'category_title', string> & Record<'image_media_width' | 'image_media_height' | 'series_movie_index' | 'movie_statistic_star_average', number>;

export type _RawMovie = {
	user_is_verified: boolean;
} & Record<'created_at' | 'movie_like_created_at' | 'movie_star_created_at', Date> & Record<'id' | 'user_id' | 'image_media_id' | 'video_media_id' | 'category_id' | 'video_media_media_video_id' | 'movie_statistic_view_count' | 'movie_statistic_comment_count' | 'movie_statistic_like_count' | 'movie_like_id' | 'movie_star_id', BigInt> & Record<'title' | 'description' | 'user_handle' | 'user_name' | 'image_media_hash' | 'video_media_hash' | 'category_title', string> & Record<'image_media_width' | 'image_media_height' | 'video_media_width' | 'video_media_height' | 'movie_statistic_star_average' | 'video_media_media_video_duration' | 'movie_star_value', number>;