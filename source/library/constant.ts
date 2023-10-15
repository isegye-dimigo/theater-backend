export const REQUIRED_ENVIRONMENT_VARIABLE_NAMES = ['DATABASE_URL', 'CACHE_DATABASE_URL', 'SEARCH_DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_HOST', 'EMAIL_PORT', 'PORT', 'RATE_LIMIT', 'PBKDF2_ITERATION', 'STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY_ID', 'STORAGE_SECRET_ACCESS_KEY', 'STORAGE_BUCKET_NAME', 'STORAGE_URL'] as const;

export const HttpErrorInformation = {
	400: 'BadRequest',
	401: 'Unauthorized',
	//402: 'PaymentRequired',
	403: 'Forbidden',
	404: 'NotFound',
	405: 'MethodNotAllowed',
	//406: 'NotAcceptable',
	//407: 'ProxyAuthenticationRequired',
	//408: 'RequestTimeout',
	409: 'Conflict',
	//410: 'Gone',
	//411: 'LengthRequired',
	//412: 'PreconditionFailed',
	413: 'PayloadTooLarge',
	//414: 'URITooLong',
	415: 'UnsupportedMediaType',
	//416: 'RangeNotSatisfiable',
	//417: 'ExpectationFailed',
	418: 'ImATeapot',
	//421: 'MisdirectedRequest',
	//422: 'UnprocessableEntity',
	//423: 'Locked',
	//424: 'FailedDependency',
	//425: 'UnorderedCollection',
	//426: 'UpgradeRequired',
	//428: 'PreconditionRequired',
	429: 'TooManyRequests',
	//431: 'RequestHeaderFieldsTooLarge',
	//451: 'UnavailableForLegalReasons',
	500: 'InternalServerError',
	//501: 'NotImplemented',
	//502: 'BadGateway',
	//503: 'ServiceUnavailable',
	//504: 'GatewayTimeout',
	//505: 'HTTPVersionNotSupported',
	//506: 'VariantAlsoNegotiates',
	//507: 'InsufficientStorage',
	//508: 'LoopDetected',
	//509: 'BandwidthLimitExceeded',
	//510: 'NotExtended',
	//511: 'NetworkAuthenticationRequire',
} as const;

/**
 * 0~9		사용자
 * 
 * 10~19	동영상
 * 
 * 20~29	댓글
 */
export const reportTypes = {
	0: '괴롭힘 및 사이버 폭력',
	1: '개인정보 침해',
	2: '명의 도용',
	3: '폭력적 위협',
	4: '보호 대상 집단에 대한 증오심 표현',
	5: '스팸 및 사기',
	6: '적절하지 않은 프로필 사진',
	7: '적절하지 않은 배너 사진',
	8: '기타',

	10: '성적인 콘텐츠',
	11: '폭력적 또는 혐오스러운 콘텐츠',
	12: '증오 또는 악의적인 콘텐츠',
	13: '괴롭힘 또는 폭력',
	14: '유해하거나 위험한 행위',
	15: '스팸 또는 혼동을 야기하는 콘텐츠',
	16: '법적 문제',
	17: '기타',

	20: '원치 않는 상업성 콘텐츠 또는 스팸',
	21: '포르노 또는 음란물',
	22: '증오심 표현 또는 노골적인 폭력',
	23: '테러 조장',
	24: '괴롭힘 또는 폭력',
	25: '자살 또는 자해',
	26: '잘못된 정보',
	27: '기타'
} as const;

export const fileSignatures = {
	avi: [Buffer.from([0x41, 0x56, 0x49, 0x20, 0x4C, 0x49, 0x53, 0x54])],
	mp4: [Buffer.from([0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]), Buffer.from([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]), Buffer.from([0x66, 0x74, 0x79, 0x70, 0x4D, 0x53, 0x4E, 0x56]), Buffer.from([0x66, 0x74, 0x79, 0x70, 0x33, 0x67, 0x70, 0x35])],
	jpg: [Buffer.from([0xFF, 0xD8])],
	png: [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])]
} as const;