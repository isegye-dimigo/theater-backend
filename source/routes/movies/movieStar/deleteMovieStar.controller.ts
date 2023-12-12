import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Movie, MovieStar, Request, Response } from '@library/type';
import { DeleteResult, JoinBuilder, Transaction } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: MovieStar['movieId'];
	};
}>, response: Response): Promise<void> {
	return kysely.transaction()
	.setIsolationLevel('serializable')
	.execute(function (transaction: Transaction<Database>): Promise<void> {
		return transaction.selectFrom('movie')
		.select('movie.id')
		.where('movie.id', '=', request['parameter']['movieId'])
		.where('movie.is_deleted', '=', false)
		.leftJoin('movie_star as star', function (joinBuilder: JoinBuilder<Database & {
			star: Database['movie_star'];
		}, 'movie' | 'star'>): JoinBuilder<Database & {
			star: Database['movie_star'];
		}, 'movie' | 'star'> {
			return joinBuilder.onRef('movie.id', '=', 'star.movie_id')
			.on('star.user_id', '=', request['user']['id']);
		})
		.select('star.id as star_id')
		.executeTakeFirst()
		.then(function (movie?: Pick<Movie, 'id'> & Nullable<PrefixPick<MovieStar, 'star_', 'id'>>): Promise<DeleteResult> {
			if(typeof(movie) !== 'undefined') {
				if(movie['star_id'] !== null) {
					return transaction.deleteFrom('movie_star')
					.where('id', '=', movie['star_id'])
					.executeTakeFirst();
				} else {
					throw new NotFound('User must starred');
				}
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		})
		.then(function (result: DeleteResult): void {
			if(result['numDeletedRows'] === 1n) {
				response.setStatus(204);
				response.send();

				return;
			} else {
				throw new NotFound('Parameter[\'movieId\'] must be valid');
			}
		});
	});
}