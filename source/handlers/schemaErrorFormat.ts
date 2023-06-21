import { FastifySchemaValidationError } from 'fastify/types/schema';

export default function schemaErrorFormatHandler(errors: FastifySchemaValidationError[], dataVariableName: string): Error {
	const instancePaths: string[] = errors[0]['instancePath'].slice(1).split('.');

	dataVariableName = String.fromCharCode(dataVariableName.charCodeAt(0) - 32) + dataVariableName.slice(1);

	if(instancePaths[0] !== '') {
		for(let i: number = 0; i < instancePaths['length']; i++) {
			dataVariableName += '[\'' + instancePaths[i].replace(/'/g, '\\\'') + '\']';
		}
	}

	return new Error(typeof(errors[0]['message']) === 'string' ? dataVariableName + ' ' + errors[0]['message'].replace(/"/g, '\'') : 'Unknown');
}