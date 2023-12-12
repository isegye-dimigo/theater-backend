import { IncomingMessage, ServerResponse } from 'http';
import Server from '@library/server';
import { CATEGORYS, FILE_SIGNATURES, REPORT_TYPES, SchemaType } from '@library/constant';
import { ColumnType } from 'kysely';

type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export type NumberSchema = {
	type: SchemaType.NUMBER;
	enum?: undefined;
	minimum?: number;
	maximum?: number;
	isInteger?: true;
	isOptional?: undefined;
} | {
	type: SchemaType.NUMBER;
	enum?: undefined;
	minimum?: number;
	maximum?: number;
	isInteger?: true;
	default?: number;
	isOptional: true;
} | {
	type: SchemaType.NUMBER;
	minimum?: undefined;
	maximum?: undefined;
	isInteger?: undefined;
	enum: number[];
	isOptional?: undefined;
} | {
	type: SchemaType.NUMBER;
	minimum?: undefined;
	maximum?: undefined;
	isInteger?: undefined;
	enum: number[];
	default?: number;
	isOptional: true;
};

export type StringSchema = {
	type: SchemaType.STRING;
	pattern?: undefined;
	enum?: undefined;
	minimum?: number;
	maximum?: number;
	isOptional?: undefined;
} | {
	type: SchemaType.STRING;
	pattern?: undefined;
	enum?: undefined;
	minimum?: number;
	maximum?: number;
	default?: string;
	isOptional: true;
} | {
	type: SchemaType.STRING;
	pattern: RegExp;
	enum?: undefined;
	minimum?: undefined;
	maximum?: undefined;
	isOptional?: undefined;
} | {
	type: SchemaType.STRING;
	pattern: RegExp;
	enum?: undefined;
	minimum?: undefined;
	maximum?: undefined;
	default?: string;
	isOptional: true;
} | {
	type: SchemaType.STRING,
	enum: string[];
	pattern?: undefined;
	minimum?: undefined;
	maximum?: undefined;
	isOptional?: undefined;
} | {
	type: SchemaType.STRING,
	enum: string[];
	pattern?: undefined;
	minimum?: undefined;
	maximum?: undefined;
	default?: string;
	isOptional: true;
}

export type BooleanSchema = {
	type: SchemaType.BOOLEAN;
	isOptional?: undefined;
} | {
	type: SchemaType.BOOLEAN;
	default?: boolean;
	isOptional: true;
};

export type NullSchema = {
	type: SchemaType.NULL;
	isOptional?: undefined;
} | {
	type: SchemaType.NULL;
	default?: null;
	isOptional: true;
};

export type ObjectSchema = {
	type: SchemaType.OBJECT;
	properties: Record<string, Schema>;
	allowAdditionalProperties?: true;
	isOptional?: undefined;
} | {
	type: SchemaType.OBJECT;
	properties: Record<string, Schema>;
	isOptional: true;
	default?: {};
	allowAdditionalProperties?: true;
};

export type ArraySchema = {
	type: SchemaType.ARRAY;
	items: Schema | Schema[];
	minimum?: number;
	maximum?: number;
	isOptional?: undefined;
} | {
	type: SchemaType.ARRAY;
	items: Schema | Schema[];
	minimum?: number;
	maximum?: number;
	isOptional: true;
	default?: {}[];
};

export type NotSchema = {
	type: SchemaType.NOT;
	isOptional?: true;
	schema: Schema;
};

export type AndSchema = {
	type: SchemaType.AND;
	isOptional?: true;
	schemas: Schema[];
};

export type OrSchema = {
	type: SchemaType.OR;
	isOptional?: true;
	schemas: Schema[];
};

export type Schema = NumberSchema | StringSchema | BooleanSchema | NullSchema | ObjectSchema | ArraySchema | AndSchema | OrSchema | NotSchema;

export type GenericKey = 'parameter' | 'query' | 'header' | 'body';

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type Handler = (request: Request<any>, response: Response) => Promise<unknown> | unknown;

export interface Request<Generic extends Partial<Record<GenericKey, unknown>> = Partial<Record<GenericKey, unknown>>> extends Required<Omit<IncomingMessage, 'statusCode' | 'statusMessage'>> {
	startTime: number;
	ip: string;
	server: Server;
	parameter: Generic['parameter'];
	query: Generic['query'];
	header: Generic['header'];
	body: Generic['body'];
	file: File;
	user: Pick<User, 'id' | 'isVerified'>;
}

export interface Response extends ServerResponse {
	request: Request;
	server: Server;
	setStatus(code: number): void;
	send(data?: unknown): void;
	redirect(url: string, code?: number): void;
}

export interface Route {
	handlers: Handler[];
	schema?: Partial<Record<GenericKey, Schema>>;
}

export interface File {
	path: string;
	type: keyof typeof FILE_SIGNATURES;
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

export interface Database {
	current_episode_statistic: {
		id: Generated<number>;
		episode_id: Generated<number>;
	};
  current_movie_statistic: {
		id: Generated<number>;
		movie_id: Generated<number>;
	};
  current_used_media: {
		id: Generated<number>;
	};
  episode: {
		id: Generated<number>;
		movie_id: number;
		user_id: number;
		index: number;
		title: string;
		description: Generated<string | null>;
		image_media_id: number;
		video_media_id: number;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  episode_comment: {
		id: Generated<number>;
		episode_id: number;
		user_id: number;
		time: number;
		content: string;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  episode_like: {
		id: Generated<number>;
		episode_id: number;
		user_id: number;
		created_at: Generated<Date>;
	};
  episode_statistic: {
		id: Generated<number>;
		episode_id: number;
		view_count: Generated<number>;
		comment_count: Generated<number>;
		like_count: Generated<number>;
		created_at: Generated<Date>;
	};
  media: {
		id: Generated<number>;
		hash: string;
		user_id: number;
		type: string;
		size: number;
		width: number;
		height: number;
		aspect_ratio: string;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  media_part: {
		id: Generated<number>;
		media_id: number;
		index: number;
		size: number;
		duration: number;
		video_bit_rate: number;
		audio_bit_rate: number;
	};
  media_video: {
		id: Generated<number>;
		media_id: number;
		duration: number;
		frame_rate: number;
		bit_rate: number;
		sample_rate: number;
		channel_count: number;
	};
  movie: {
		id: Generated<number>;
		user_id: number;
		title: string;
		description: Generated<string | null>;
		media_id: number;
		category_id: keyof typeof CATEGORYS;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  movie_comment: {
		id: Generated<number>;
		movie_id: number;
		user_id: number;
		content: string;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  movie_star: {
		id: Generated<number>;
		user_id: number;
		movie_id: number;
		value: number;
		created_at: Generated<Date>;
	};
  movie_statistic: {
		id: Generated<number>;
		movie_id: number;
		comment_count: Generated<number>;
		view_count: Generated<number>;
		star_average: Generated<number>;
		created_at: Generated<Date>;
	};
  report: {
		id: Generated<number>;
		user_id: number;
		type: keyof typeof REPORT_TYPES;
		target_id: number;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  user: {
		id: Generated<number>;
		email: string;
		password: string;
		handle: string;
		name: string;
		description: Generated<string | null>;
		profile_media_id: Generated<number | null>;
		banner_media_id: Generated<number | null>;
		is_verified: Generated<boolean>;
		is_deleted: Generated<boolean>;
		created_at: Generated<Date>;
	};
  user_history: {
		id: Generated<number>;
		episode_id: number;
		user_id: number;
		time: number;
		created_at: Generated<Date>;
	};
  user_verification: {
		id: Generated<number>;
		token: string;
		email: string;
		password: string;
		name: string;
		created_at: Generated<Date>;
	};
}

export interface currentEpisodeStatistic {
	id: number;
}

export interface currentMovieStatistic {
	id: number;
}

export interface currentUsedMedia {
	id: number;
}

export interface Episode {
  id: number;
  movieId: number;
  userId: number;
  index: number;
  title: string;
  description: string | null;
  imageMediaId: number;
  videoMediaId: number;
  isDeleted: boolean;
  createdAt: Date;
}

export interface EpisodeComment {
  id: number;
  episodeId: number;
  userId: number;
  time: number;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
}

export interface EpisodeLike {
  id: number;
	episodeId: number;
  userId: number;
  createdAt: Date;
}

export interface EpisodeStatistic {
  id: number;
  episodeId: number;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  createdAt: Date;
}

export interface Media {
  id: number;
  hash: string;
  userId: number;
  type: string;
  size: number;
  width: number;
  height: number;
  aspectRatio: string;
  isDeleted: boolean;
  createdAt: Date;
}

export interface MediaPart {
  id: number;
  mediaId: number;
  index: number;
  size: number;
  duration: number;
  videoBitRate: number;
  audioBitRate: number;
}

export interface MediaVideo {
  id: number;
  mediaId: number;
  duration: number;
  frameRate: number;
  bitRate: number;
  sampleRate: number;
  channelCount: number;
}

export interface Movie {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  mediaId: number;
  categoryId: keyof typeof CATEGORYS;
  isDeleted: boolean;
  createdAt: Date;
}

export interface MovieComment {
  id: number;
  movieId: number;
  userId: number;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
}

export interface MovieStar {
  id: number;
  userId: number;
  movieId: number;
  value: number;
  createdAt: Date;
}

export interface MovieStatistic {
  id: number;
  movieId: number;
  viewCount: number;
  commentCount: number;
  starAverage: number;
  createdAt: Date;
}

export interface Report {
  id: number;
  userId: number;
  type: keyof typeof REPORT_TYPES;
  targetId: number;
  isDeleted: boolean;
  createdAt: Date;
}

export interface User {
  id: number;
  email: string;
  password: string;
  handle: string;
  name: string;
  description: string | null;
  profileMediaId: number | null;
  bannerMediaId: number | null;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

export interface UserHistory {
  id: number;
  episodeId: number;
  userId: number;
  time: number;
  createdAt: Date;
}

export interface UserVerification {
  id: number;
  token: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface CurrentEpisodeStatistic {
	id: number;
	episodeId: number;
};

export interface CurrentMovieStatistic {
	id: number;
	movieId: number;
};

export interface Category {
	id: number;
	title: string;
}

export interface PageQuery {
	'page[size]': number;
	'page[index]': number;
	'page[order]': 'desc' | 'asc';
}