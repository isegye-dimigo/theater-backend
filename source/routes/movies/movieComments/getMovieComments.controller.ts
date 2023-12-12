import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Media, Movie, MovieComment, PageQuery, Request, Response, User } from '@library/type';
import { Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieComment['movieId'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('id')
		.where('id', '=', request['parameter']['movieId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'>): Promise<(Pick<MovieComment, 'id' | 'content' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>>)[]> {
			if(typeof(movie) !== 'undefined') {
				return transaction.selectFrom('movie_comment')
				.select(['movie_comment.id', 'movie_comment.content', 'movie_comment.created_at as createdAt'])
				.where('movie_comment.movie_id', '=', request['parameter']['movieId'])
				.where('movie_comment.is_deleted', '=', false)
				.orderBy('movie_comment.id', request['query']['page[order]'] === 'asc' ? 'asc' : 'desc')
				.limit(request['query']['page[size]'])
				.offset(request['query']['page[size]'] * request['query']['page[index]'])
				.innerJoin('user', 'movie_comment.user_id', 'user.id')
				.select(['user.id as user_id', 'user.handle as user_handle', 'user.name as user_name', 'user.is_verified as user_isVerified'])
				.leftJoin('media as user_profileMedia', 'user.profile_media_id', 'user_profileMedia.id')
				.select(['user_profileMedia.id as user_profileMedia_id', 'user_profileMedia.hash as user_profileMedia_hash', 'user_profileMedia.width as user_profileMedia_width', 'user_profileMedia.height as user_profileMedia_height'])
				.execute();
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (rawComments: (Pick<MovieComment, 'id' | 'content' | 'createdAt'> & PrefixPick<User, 'user_', 'id' | 'handle' | 'name' | 'isVerified'> & Nullable<PrefixPick<Media, 'user_profileMedia_', 'id' | 'hash' | 'width' | 'height'>>)[]): void {
			const comments: (Pick<MovieComment, 'id' | 'content' | 'createdAt'> & {
				user: Pick<User, 'id' | 'handle' | 'name' | 'isVerified'> & {
					profileMedia?: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				};
			})[] = [];

			for(let i: number = 0; i < rawComments['length']; i++) {
				comments.push({
					id: rawComments[i]['id'],
					content: rawComments[i]['content'],
					createdAt: rawComments[i]['createdAt'],
					user: Object.assign({
						id: rawComments[i]['user_id'],
						handle: rawComments[i]['user_handle'],
						name: rawComments[i]['user_name'],
						isVerified: rawComments[i]['user_isVerified']
					}, rawComments[i]['user_profileMedia_id'] !== null ? {
						profileMedia: {
							id: rawComments[i]['user_profileMedia_id']  as number,
							hash: rawComments[i]['user_profileMedia_hash'] as string,
							width: rawComments[i]['user_profileMedia_width'] as number,
							height: rawComments[i]['user_profileMedia_height'] as number
						}
					} as const : undefined)
				});
			}

			response.send(comments);
			
			return;
		});
	});
}