import { HttpErrorInformation } from '@library/constant';

export class HttpError<T extends keyof typeof HttpErrorInformation> extends Error {
	statusCode: T;

	constructor(statusCode: T, message?: string) {
		super(message);

		this.name = HttpErrorInformation[statusCode];
		this.statusCode = statusCode;

		return;
	}
}

export class BadRequest extends HttpError<400> {
	constructor(message?: string) {
		super(400, message);

		return;
	}
}

export class Unauthorized extends HttpError<401> {
	constructor(message?: string) {
		super(401, message);

		return;
	}
}

//export class PaymentRequired extends HttpError<402> {
//	constructor(message?: string) {
//		super(402, message);

//		return;
//	}
//}

export class Forbidden extends HttpError<403> {
	constructor(message?: string) {
		super(403, message);

		return;
	}
}

export class NotFound extends HttpError<404> {
	constructor(message?: string) {
		super(404, message);

		return;
	}
}

export class MethodNotAllowed extends HttpError<405> {
	constructor(message?: string) {
		super(405, message);

		return;
	}
}

//export class NotAcceptable extends HttpError<406> {
//	constructor(message?: string) {
//		super(406, message);

//		return;
//	}
//}

//export class ProxyAuthenticationRequired extends HttpError<407> {
//	constructor(message?: string) {
//		super(407, message);

//		return;
//	}
//}

//export class RequestTimeout extends HttpError<408> {
//	constructor(message?: string) {
//		super(408, message);

//		return;
//	}
//}

export class Conflict extends HttpError<409> {
	constructor(message?: string) {
		super(409, message);

		return;
	}
}

//export class Gone extends HttpError<410> {
//	constructor(message?: string) {
//		super(410, message);

//		return;
//	}
//}

//export class LengthRequired extends HttpError<411> {
//	constructor(message?: string) {
//		super(411, message);

//		return;
//	}
//}

//export class PreconditionFailed extends HttpError<412> {
//	constructor(message?: string) {
//		super(412, message);

//		return;
//	}
//}

export class PayloadTooLarge extends HttpError<413> {
	constructor(message?: string) {
		super(413, message);

		return;
	}
}

//export class URITooLong extends HttpError<414> {
//	constructor(message?: string) {
//		super(414, message);

//		return;
//	}
//}

export class UnsupportedMediaType extends HttpError<415> {
	constructor(message?: string) {
		super(415, message);

		return;
	}
}

//export class RangeNotSatisfiable extends HttpError<416> {
//	constructor(message?: string) {
//		super(416, message);

//		return;
//	}
//}

//export class ExpectationFailed extends HttpError<417> {
//	constructor(message?: string) {
//		super(417, message);

//		return;
//	}
//}

export class ImATeapot extends HttpError<418> {
	constructor(message?: string) {
		super(418, message);

		return;
	}
}

//export class MisdirectedRequest extends HttpError<421> {
//	constructor(message?: string) {
//		super(421, message);

//		return;
//	}
//}

//export class UnprocessableEntity extends HttpError<422> {
//	constructor(message?: string) {
//		super(422, message);

//		return;
//	}
//}

//export class Locked extends HttpError<423> {
//	constructor(message?: string) {
//		super(423, message);

//		return;
//	}
//}

//export class FailedDependency extends HttpError<424> {
//	constructor(message?: string) {
//		super(424, message);

//		return;
//	}
//}

//export class UnorderedCollection extends HttpError<425> {
//	constructor(message?: string) {
//		super(425, message);

//		return;
//	}
//}

//export class UpgradeRequired extends HttpError<426> {
//	constructor(message?: string) {
//		super(426, message);

//		return;
//	}
//}

//export class PreconditionRequired extends HttpError<428> {
//	constructor(message?: string) {
//		super(428, message);

//		return;
//	}
//}

export class TooManyRequests extends HttpError<429> {
	constructor(message?: string) {
		super(429, message);

		return;
	}
}

//export class RequestHeaderFieldsTooLarge extends HttpError<431> {
//	constructor(message?: string) {
//		super(431, message);

//		return;
//	}
//}

//export class UnavailableForLegalReasons extends HttpError<451> {
//	constructor(message?: string) {
//		super(451, message);

//		return;
//	}
//}

export class InternalServerHttpError extends HttpError<500> {
	constructor(message?: string) {
		super(500, message);

		return;
	}
}

//export class NotImplemented extends HttpError<501> {
//	constructor(message?: string) {
//		super(501, message);

//		return;
//	}
//}

//export class BadGateway extends HttpError<502> {
//	constructor(message?: string) {
//		super(502, message);

//		return;
//	}
//}

//export class ServiceUnavailable extends HttpError<503> {
//	constructor(message?: string) {
//		super(503, message);

//		return;
//	}
//}

//export class GatewayTimeout extends HttpError<504> {
//	constructor(message?: string) {
//		super(504, message);

//		return;
//	}
//}

//export class HTTPVersionNotSupported extends HttpError<505> {
//	constructor(message?: string) {
//		super(505, message);

//		return;
//	}
//}

//export class VariantAlsoNegotiates extends HttpError<506> {
//	constructor(message?: string) {
//		super(506, message);

//		return;
//	}
//}

//export class InsufficientStorage extends HttpError<507> {
//	constructor(message?: string) {
//		super(507, message);

//		return;
//	}
//}

//export class LoopDetected extends HttpError<508> {
//	constructor(message?: string) {
//		super(508, message);

//		return;
//	}
//}

//export class BandwidthLimitExceeded extends HttpError<509> {
//	constructor(message?: string) {
//		super(509, message);

//		return;
//	}
//}

//export class NotExtended extends HttpError<510> {
//	constructor(message?: string) {
//		super(510, message);

//		return;
//	}
//}

//export class NetworkAuthenticationRequire extends HttpError<511> {
//	constructor(message?: string) {
//		super(511, message);

//		return;
//	}
//}