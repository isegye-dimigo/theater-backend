import { Schema } from '@library/type';
import { Category } from '@prisma/client';
import commonSchema from '@schemas/common';

export default {
	id: commonSchema['positiveInteger'],
	title: commonSchema['default'].string().minLength(1).maxLength(32)
} satisfies Schema<Category>;