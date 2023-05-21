import { Schema } from '@library/schema';
import schema from 'fluent-json-schema';

const commonSchema: Schema<'id' | 'hash' | 'datetime'> = new Schema<'id' | 'hash' | 'datetime'>({
	id: schema.integer().minimum(1).maximum(Number['MAX_VALUE']),
	hash: schema.string().pattern(/^[0-9a-f]{128}$/),
	datetime: schema.string().format('date-time')
});

export default commonSchema;