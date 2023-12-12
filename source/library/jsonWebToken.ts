import { createHmac } from 'crypto';

export default class JsonWebToken {
	private token: string;
	private tokenSpliterIndex: number;
	public secretKey: string;
	public payload: Record<string, unknown>;

	public static create(payload: Record<string, unknown>, secretKey: string): string {
		const headerAndPayload: string = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url');

		return headerAndPayload + '.' + createHmac('sha512', secretKey).update(headerAndPayload).digest('base64url');
	}

	public static getEpoch(): number {
		return Math.trunc(Date.now() / 1000);
	}

	public static deepFreeze(target: unknown): void {
		Object.freeze(target);

		if(typeof(target) === 'object' && target !== null) {
			const keys: (keyof typeof target)[] = Object.getOwnPropertyNames(target) as (keyof typeof target)[];

			for(let i: number = 0; i < keys['length']; i++) {
				if(typeof(target[keys[i]]) === 'object') {
					JsonWebToken.deepFreeze(target[keys[i]]);
				}
			}
		}

		return;
	}

	constructor(token: string, secretKey: string) {
		this['tokenSpliterIndex'] = token.indexOf('.', 37);

		if(this['tokenSpliterIndex'] !== -1) {
			try {
				this['payload'] = JSON.parse(Buffer.from(token.slice(37, this['tokenSpliterIndex']), 'base64url').toString('utf-8'));
				
				if(typeof(this['payload']) === 'object' && this['payload'] !== null) {
					JsonWebToken.deepFreeze(this['payload']);
				} else {
					throw null;
				}
			} catch {
				throw new Error('Payload must be valid');
			}
	
			this['token'] = token;
			this['secretKey'] = secretKey;
		} else {
			throw new Error('Token must be valid');
		}
	}

	public isValid(): boolean {
		return createHmac('sha512', this['secretKey']).update(this['token'].slice(0, this['tokenSpliterIndex'])).digest('base64url') === this['token'].slice(this['tokenSpliterIndex'] + 1) && (typeof(this['payload']['exp']) === 'number' ? this['payload']['exp'] : Infinity) > JsonWebToken.getEpoch();
	}
}