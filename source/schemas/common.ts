import { Schema } from '@library/schema';
import schema from 'fluent-json-schema';

const commonSchema: Schema<'positiveInteger' | 'sha512Hex' | 'datetime' | 'jsonWebToken'> = new Schema<'positiveInteger' | 'sha512Hex' | 'datetime' | 'jsonWebToken'>({
	positiveInteger: schema.integer().minimum(1).maximum(Number['MAX_VALUE']),
	sha512Hex: schema.string().pattern(/^[0-9a-f]{128}$/),
	datetime: schema.string().format('date-time'),
	jsonWebToken: schema.string().pattern(/^[A-Za-z0-9_-]{2,}(\.[A-Za-z0-9-_]{2,}){2}$/)
});

export default commonSchema;