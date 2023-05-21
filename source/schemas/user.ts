import { Schema } from '@library/schema';
import { User } from '@prisma/client';
import schema from 'fluent-json-schema';
import commonSchema from '@schemas/common';

const userSchema: Schema<keyof User> = new Schema<keyof User>({
	id: commonSchema.get('id'),
	email: schema.string().format('email'),
	password: schema.string().minLength(1),
	handle: schema.string().pattern(/^[A-Za-z0-9-_.]{3,30}$/),
	phone: schema.string().pattern(/^0[0-9]{8}$/),
	name: schema.string().maxLength(64),
	description: schema.string().maxLength(1024),
	profileImageId: commonSchema.get('id'),
	bannerImageId: commonSchema.get('id'),
	verificationKey: commonSchema.get('hash'),
	isVerified: schema.boolean(),
	isDeleted: schema.boolean(),
	createdAt: commonSchema.get('datetime')
});

export default userSchema;