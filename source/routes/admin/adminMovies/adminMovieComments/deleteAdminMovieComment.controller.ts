import { kysely } from '@library/database';
import { NotFound, Unauthorized } from '@library/error';
import { Database, Movie, MovieComment, Request, Response } from '@library/type';
import { JoinBuilder, Transaction, UpdateResult } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieComment['movieId'];
		movieCommentId: MovieComment['id'];
	};
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
		.select('comment.id as comment_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<MovieComment, 'comment_', 'id'>>): Promise<UpdateResult> {
			if(typeof(movie) !== 'undefined') {
				if(movie['comment_id'] !== null) {
					return transaction.updateTable('movie_comment')
					.set({
						is_deleted: true
					})
					.where('id', '=', request['parameter']['movieCommentId'])
					.executeTakeFirst();
				} else {
					throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (result: UpdateResult): void {
			if(result['numUpdatedRows'] === 1n) {
				response.setStatus(204);
				response.send();

				return;
			} else {
				throw new NotFound('Parameter[\'movieCommentId\'] must be valid');
			}
		});
	});
}