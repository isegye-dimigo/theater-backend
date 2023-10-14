import { getEpoch } from '@library/utility';
import { createHmac } from 'crypto';

export default class JsonWebToken {
	private token: string;
	public secretKey: string;
	public payload: unknown;

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
		} else {
			throw new Error('Target must be valid');
		}

		return;
	}

	constructor(token: string, secretKey: string) {
		this['token'] = token;

		try {
			const tokenWithoutHeader: string = token.slice(token.indexOf('.') + 1);
			this['payload'] = JSON.parse(Buffer.from(tokenWithoutHeader.slice(0, tokenWithoutHeader.indexOf('.')), 'base64url').toString('utf-8'));
			
			JsonWebToken.deepFreeze(this['payload']);
		} catch {
			throw new Error('Payload must be valid');
		}

		this['secretKey'] = secretKey;

		return;
	}

	public isValid(): boolean {
		const splitTokens: string[] = this['token'].split('.');
		// @ts-expect-error :: Already checked
		const expireAt: number = this['payload']['exp'] || Infinity;

		return createHmac('sha512', this['secretKey']).update(splitTokens.slice(0, 2).join('.')).digest('base64url') === splitTokens[2] && expireAt > getEpoch();
	}
}