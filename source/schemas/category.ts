import { Schema } from '@library/schema';
import { Category } from '@prisma/client';
import commonSchema from '@schemas/common';

const categorySchema: Schema<keyof Category> = new Schema<keyof Category>({
	id: commonSchema.get('positiveInteger'),
	title: commonSchema['defaultSchema'].string().minLength(1).maxLength(32)
});

export default categorySchema;