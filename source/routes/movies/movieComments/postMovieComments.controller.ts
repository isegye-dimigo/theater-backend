import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Movie, MovieComment, Request, Response } from '@library/type';
import { Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieComment['movieId'];
	};
	body: Pick<MovieComment, 'content'>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('id')
		.where('id', '=', request['parameter']['movieId'])
		.where('is_deleted', '=', false)
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'>): Promise<Pick<MovieComment, 'id' | 'createdAt'>> {
			if(typeof(movie) !== 'undefined') {
				return transaction.insertInto('movie_comment')
				.values({
					movie_id: request['parameter']['movieId'],
					user_id: request['user']['id'],
					content: request['body']['content']
				})
				.returning(['id', 'created_at as createdAt'])
				.executeTakeFirstOrThrow();
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (comment: Pick<MovieComment, 'id' | 'createdAt'>): void {
			response.send({
				id: comment['id'],
				content: request['body']['content'],
				createdAt: comment['createdAt']
			} satisfies Pick<MovieComment, 'id' | 'content' | 'createdAt'>);

			return;
		});
	});
}