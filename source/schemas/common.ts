import { Schema } from '@library/schema';
import schema from 'fluent-json-schema';

const commonSchema: Schema<'positiveInteger' | 'sha512Hex' | 'datetime' | 'jsonWebToken'> = new Schema<'positiveInteger' | 'sha512Hex' | 'datetime' | 'jsonWebToken'>({
	positiveInteger: schema.integer().minimum(1).maximum(Number['MAX_VALUE']),
	sha512Hex: schema.string().pattern(/^[0-9a-f]{128}$/),
	datetime: schema.string().format('date-time'),
	jsonWebToken: schema.string().pattern(/^[a-z0-9-_]*\.[a-z0-9-_]*\.[a-z0-9-_]*$/)
});

export default commonSchema;