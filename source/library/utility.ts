import schema, { ArraySchema, JSONSchema, NullSchema, ObjectSchema } from 'fluent-json-schema'
import { RouteOptions, SchemaKey } from '@library/type'

export function getEpoch(): number {
	return Math.trunc(Date.now() / 1000);
}

export function getArraySchema(jsonSchemas: JSONSchema[], options: Partial<{ isUniqueItems: boolean; } & Record<`${'max' | 'min'}imumLength`, number>> = {}): ArraySchema {
	let _schema: ArraySchema = schema.array();

	for(let i = 0; i < jsonSchemas.length; i++) {
		_schema = _schema.items(jsonSchemas[i]);
	}

	if(typeof(options['maximumLength']) === 'number') {
		_schema = _schema.maxItems(options['maximumLength']);
	}

	if(typeof(options['minimumLength']) === 'number') {
		_schema = _schema.minItems(options['minimumLength']);
	}

	if(options['isUniqueItems'] === true) {
		_schema = _schema.uniqueItems(true);
	}

	return _schema.readOnly(true);
}

export function getObjectSchema(object: Required<Required<RouteOptions>['schema']>[SchemaKey]): ObjectSchema | NullSchema {
	const keys: string[] = Object.getOwnPropertyNames(object);

	let resultSchema: ObjectSchema = schema.object().additionalProperties(false);

	if(object['$isRequired'] === true) {
	resultSchema = resultSchema.required();
	}

	for(let i = 0; i < keys['length']; i++) {
		// @ts-expect-error
		if(keys[i] !== '$isRequired' && typeof(object[keys[i]]) === 'object') {
			// @ts-expect-error
			resultSchema = resultSchema.prop(keys[i], Object.hasOwn(object[keys[i]], 'isFluentJSONSchema') ? object[keys[i]] : getObjectSchema(object[keys[i]]));
		}
	}

	return resultSchema.readOnly(true);
}