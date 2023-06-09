import { Schema } from '@library/schema';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';
import { defaultPageSize } from '@library/constant';

const pageSchema: Schema<keyof PageQuery> = new Schema<keyof PageQuery>({
	'page[index]': schema.integer().minimum(0).maximum(Number['MAX_VALUE']).default(0),
	'page[size]': commonSchema.get('positiveInteger').default(defaultPageSize),
	'page[order]': schema.string().enum(['asc', 'desc']).default('desc')
});

export default pageSchema;