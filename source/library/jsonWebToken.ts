import { createHmac } from 'crypto';
import { getEpoch } from '@library/utility';

export default class JsonWebToken {
	private token: string;
	private _secretKey: string;
	private _payload: Record<string, any> | null;

	public static create(payload: Record<string, any>, secretKey: string): string {
		const headerAndPayload: string = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url');

		return headerAndPayload + '.' + createHmac('sha512', secretKey).update(headerAndPayload).digest('base64url');
	}

	constructor(token: string, secretKey: string) {
		this['token'] = token;

		try {
			this['_payload'] = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'));

			this.deepFreeze(this['_payload']);
		} catch {
			throw new Error('Payload must be valid');
		}

		this['_secretKey'] = secretKey;

		return;
	}

	private deepFreeze(object: JsonWebToken['_payload']): void {
		Object.freeze(object);

		if(object !== null) {
			const keys: string[] = Object.getOwnPropertyNames(object);

			for(let i: number = 0; i < keys['length']; i++) {
				if(typeof(object[keys[i]]) === 'object') {
					this.deepFreeze(object[keys[i]]);
				}
			}
		}

		return;
	}

	public get payload(): JsonWebToken['_payload'] {
		return this['_payload'];
	}

	public set secretKey(secretKey: string) {
		this['_secretKey'] = secretKey;
	}

	public isValid(): boolean {
		const splitTokens: string[] = this['token'].split('.');

		return this['_payload'] !== null && createHmac('sha512', this._secretKey).update(splitTokens.slice(0, 2).join('.')).digest('base64url') === splitTokens[2] && (this._payload.exp as number) > getEpoch();
	}
}