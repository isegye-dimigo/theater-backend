import { Schema } from '@library/schema';
import { UserVerification } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';

const userVerificationSchema: Schema<keyof UserVerification> = new Schema<keyof UserVerification>({
	id: commonSchema.get('positiveInteger'),
	email: schema.string().format('email'),
	password: schema.string().minLength(1),
	name: schema.string().minLength(1).maxLength(64),
	token: commonSchema['defaultSchema'].string().pattern(/^[0-9a-f]{40}$/),
	createdAt: commonSchema.get('datetime')
});

export default userVerificationSchema;