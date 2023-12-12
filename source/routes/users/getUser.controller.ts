import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Media, Request, Response, User } from '@library/type';

export default function (request: Request<{
	parameter: {
		userHandle: User['handle'];
	};
}>, response: Response): Promise<void> {
	return kysely.selectFrom('user')
	.select(['user.id', 'user.handle', 'user.name', 'user.description', 'user.is_verified as isVerified', 'user.created_at as createdAt'])
	.where('user.is_deleted', '=', false)
	.leftJoin('media as profileMedia', 'user.profile_media_id', 'profileMedia.id')
	.select(['profileMedia.id as profileMedia_id', 'profileMedia.hash as profileMedia_hash', 'profileMedia.width as profileMedia_width', 'profileMedia.height as profileMedia_height'])
	.leftJoin('media as bannerMedia', 'user.banner_media_id', 'bannerMedia.id')
	.select(['bannerMedia.id as bannerMedia_id', 'bannerMedia.hash as bannerMedia_hash', 'bannerMedia.width as bannerMedia_width', 'bannerMedia.height as bannerMedia_height'])
	.executeTakeFirst()
	.then(function (user?: Pick<User, 'id' | 'handle' | 'name' | 'description' | 'isVerified' | 'createdAt'> & Nullable<PrefixPick<Media, 'profileMedia_' | 'bannerMedia_', 'id' | 'hash' | 'width' | 'height'>>) {
		if(typeof(user) !== 'undefined') {
			response.send(Object.assign({
				id: user['id'],
				handle: user['handle'],
				name: user['name'],
				description: user['description'],
				isVerified: user['isVerified'],
				createdAt: user['createdAt']
			}, user['profileMedia_id'] !== null ? {
				profileMedia: {
					id: user['profileMedia_id'],
					hash: user['profileMedia_hash'] as string,
					width: user['profileMedia_width'] as number,
					height: user['profileMedia_height'] as number
				}
			} : undefined, user['bannerMedia_id'] !== null ? {
				bannerMedia: {
					id: user['bannerMedia_id'],
					hash: user['bannerMedia_hash'] as string,
					width: user['bannerMedia_width'] as number,
					height: user['bannerMedia_height'] as number
				}
			} : undefined) satisfies Pick<User, 'id' | 'handle' | 'name' | 'description' | 'isVerified' | 'createdAt'> & Partial<Record<'profileMedia' | 'bannerMedia', Pick<Media, 'id' | 'hash' | 'width' | 'height'>>>);

			return;
		} else {
			throw new NotFound('Parameter[\'userHandle\'] must be valid');
		}
	});
}