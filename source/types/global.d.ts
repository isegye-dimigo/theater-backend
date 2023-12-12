import { ENVIRONMENT_VARIABLE_NAMES } from '@library/constant';
import { LogLevel } from '@library/type';

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Record<typeof ENVIRONMENT_VARIABLE_NAMES[number], string> {
			NODE_ENV: 'development' | 'production';
			LOG_LEVEL: LogLevel;
			JSON_WEB_TOKEN_SECRET: string;
		}
	}

	type ResolveFunction<T = void> = (value: T) => void;
	
	type RejectFunction = (error: unknown) => void;

	type PrefixKey<TKey, TPrefix extends string> = TKey extends string ? `${TPrefix}${TKey}` : never;

	type UnprefixKey<TPrefixedKey, TPrefix extends string> = TPrefixedKey extends PrefixKey<infer TKey, TPrefix> ? TKey : '';

	type PrefixValue<TObject extends object, TPrefixedKey extends string, TPrefix extends string> = TObject extends {[K in UnprefixKey<TPrefixedKey, TPrefix>]: infer TValue} ? TValue : never;

	type PrefixPick<TObject extends object, TPrefix extends string, TKey extends keyof TObject> = {
		[Key in PrefixKey<keyof Pick<TObject, TKey>, TPrefix>]: PrefixValue<TObject, Key, TPrefix>;
	};

	type Nullable<T> = T extends object ? {
		[K in keyof T]: T[K] | null;
	} : T | null;
	
	type NoneNullable<T> = T extends object ? {
		[K in keyof T]: T[K] & {};
	} : T & {};

	type SnakeCaseKey<S extends string> = S extends `${infer T}${infer U}` ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${SnakeCaseKey<U>}` : S

	type CamelToSnakeCase<T> = {
		[K in keyof T as SnakeCaseKey<string & K>]: T[K];
	}
}
