export default function serializeHandler(payload: unknown, statusCode: number): string {
	payload ??= null;

	return JSON.stringify(statusCode < 300 ? {
		status: 'success',
		data: payload,
	} : payload);
}