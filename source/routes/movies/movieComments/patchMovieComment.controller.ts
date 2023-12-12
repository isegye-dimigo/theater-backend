import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, MovieComment, Request, Response } from '@library/type';
import { JoinBuilder, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieComment['movieId'];
		movieCommentId: MovieComment['id'];
	};
	body: Pick<MovieComment, 'content'>;
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.id')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('movie_comment as comment', function (joinBuilder: JoinBuilder<Database & {
			comment: Database['movie_comment'];
		}, 'movie' | 'comment'>): JoinBuilder<Database & {
			comment: Database['movie_comment'];
		}, 'movie' | 'comment'> {
			return joinBuilder.onRef('movie.id', '=', 'comment.movie_id')
			.on('comment.id', '=', request['parameter']['movieCommentId'])
			.on('comment.is_deleted', '=', false);
		})
		.select('comment.user_id as comment_userId')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<MovieComment, 'comment_', 'userId'>>): Promise<UpdateResult> {
			if(typeof(movie) !== 'undefined') {
				if(movie['comment_userId'] !== null) {
					if(request['user']['id'] === movie['comment_userId']) {
						return transaction.updateTable('movie_comment')
						.set({
							content: request['body']['content']
						})
						.where('id', '=', request['parameter']['movieCommentId'])
						.executeTakeFirst();
					} else {
						throw new Unauthorized('User must be same');
					}
				} else {
					throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (result: UpdateResult): void {
			if(result['numUpdatedRows'] === 1n) {
				response.send({
					id: request['parameter']['movieCommentId'],
					content: request['body']['content']
				} satisfies Pick<MovieComment, 'id' | 'content'>);

				return;
			} else {
				throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
			}
		});
	});
}