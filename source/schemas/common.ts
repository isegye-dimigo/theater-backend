import { Schema } from '@library/schema';
import schema from 'fluent-json-schema';

const commonSchema: Schema<'positiveInteger' | 'sha512Hex' | 'datetime'> = new Schema<'positiveInteger' | 'sha512Hex' | 'datetime'>({
	positiveInteger: schema.integer().minimum(1).maximum(Number['MAX_VALUE']),
	sha512Hex: schema.string().pattern(/^[0-9a-f]{128}$/),
	datetime: schema.string().format('date-time')
});

export default commonSchema;