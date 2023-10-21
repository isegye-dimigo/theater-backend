import commonSchema from '@schemas/common';
import { PageQuery, Schema } from '@library/type';

export default {
	'page[index]': commonSchema['default'].integer().minimum(0).maximum(Number['MAX_VALUE']).default(0),
	'page[size]': commonSchema['positiveInteger'].default(50),
	'page[order]': commonSchema['default'].string().enum(['asc', 'desc']).default('desc')
} satisfies Schema<PageQuery>;