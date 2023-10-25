import { getEpoch } from '@library/utility';
import { createHmac } from 'crypto';

export default class JsonWebToken {
	private token: string;
	private tokenSpliterIndex: number;
	public secretKey: string;
	public payload: Record<string, any>;

	public static create(payload: Record<string, any>, secretKey: string): string {
		const headerAndPayload: string = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url');

		return headerAndPayload + '.' + createHmac('sha512', secretKey).update(headerAndPayload).digest('base64url');
	}

	public static deepFreeze(target: unknown): void {
		Object.freeze(target);

		if(typeof(target) === 'object' && target !== null) {
			const keys: string[] = Object.getOwnPropertyNames(target);

			for(let i: number = 0; i < keys['length']; i++) {
				// @ts-expect-error :: Already checked
				if(typeof(target[keys[i]]) === 'object') {
					// @ts-expect-error :: Already checked
					this.deepFreeze(target[keys[i]]);
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
		return createHmac('sha512', this['secretKey']).update(this['token'].slice(0, this['tokenSpliterIndex'])).digest('base64url') === this['token'].slice(this['tokenSpliterIndex'] + 1) && (typeof(this['payload']['exp']) === 'number' ? this['payload']['exp'] : Infinity) > getEpoch();
	}
}