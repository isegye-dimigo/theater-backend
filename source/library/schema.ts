import { ArraySchema, BooleanSchema, IntegerSchema, NumberSchema, ObjectSchema, StringSchema } from 'fluent-json-schema';

export class Schema<T extends string> {
	private schemas: Record<T, ObjectSchema | StringSchema | NumberSchema | ArraySchema | IntegerSchema | BooleanSchema>;
	
	constructor(schemas: Schema<T>['schemas']) {
		this['schemas'] = schemas;
	}

	get<K extends keyof Schema<T>['schemas']>(key: K): Schema<T>['schemas'][K] {
		return this['schemas'][key];
	}
}