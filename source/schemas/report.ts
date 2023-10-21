import { Schema } from '@library/type';
import { Report } from '@prisma/client';
import commonSchema from '@schemas/common';
import userSchema from '@schemas/user';
import { reportTypes } from '@library/constant';

export default {
	id: commonSchema['positiveInteger'],
	userId: userSchema['id'],
	type: commonSchema['default'].integer().enum(Object.keys(reportTypes)),
	targetId: commonSchema['positiveInteger'],
	isDeleted: commonSchema['boolean'],
	createdAt: commonSchema['datetime']
} satisfies Schema<Report>;