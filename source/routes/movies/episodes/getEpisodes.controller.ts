import { kysely } from '@library/database';
import { NotFound } from '@library/error';
import { Database, Media, Movie, Episode, PageQuery, Request, Response } from '@library/type';
import { Transaction, sql } from 'kysely';

export default function (request: Request<{
	parameter: {
		movieId: Episode['movieId'];
	};
	query: PageQuery;
}>, response: Response): Promise<void> {
		return kysely.transaction()
		.execute(function (transaction: Transaction<Database>): Promise<void> {
			return transaction.selectFrom('movie')
			.select('movie.id as id')
			.where('movie.id', '=', request['parameter']['movieId'])
			.where('movie.is_deleted', '=', false)
			.executeTakeFirst()
			.then(function (movie?: Pick<Movie, 'id'>): Promise<(Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]> {
				if(typeof(movie) !== 'undefined') {
					return transaction.selectFrom('episode')
					.select(['episode.id', 'episode.index', 'episode.title', sql<string | null>`LEFT(episode.description, 256)`.as('description'), 'episode.created_at as createdAt'])
					.where('episode.movie_id', '=', request['parameter']['movieId'])
					.where('episode.is_deleted', '=', false)
					.orderBy('episode.index', request['query']['page[order]'] === 'desc' ? 'desc' : 'asc')
					.limit(request['query']['page[size]'])
					.offset(request['query']['page[size]'] * request['query']['page[index]'])
					.innerJoin('media as imageMedia', 'episode.image_media_id', 'imageMedia.id')
					.select(['imageMedia.id as imageMedia_id', 'imageMedia.hash as imageMedia_hash', 'imageMedia.width as imageMedia_width', 'imageMedia.height as imageMedia_height'])
					.execute();
				} else {
					throw new NotFound('Parameter[\'movieId\'] must be valid');
				}
			})
			.then(function (rawEpisodes: (Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & PrefixPick<Media, 'imageMedia_', 'id' | 'hash' | 'width' | 'height'>)[]): void {
				const episodes: (Pick<Episode, 'id' | 'index' | 'title' | 'description' | 'createdAt'> & {
					imageMedia: Pick<Media, 'id' | 'hash' | 'width' | 'height'>;
				})[] = [];
				
				for(let i: number = 0; i < rawEpisodes['length']; i++) {
					let slicedDescription: string | null = null;
		
					if(typeof(rawEpisodes[i]['description']) === 'string') {
						slicedDescription = (rawEpisodes[i]['description'] as string).replace(/(\n|\s)+/g, ' ');
		
						if(slicedDescription['length'] > 128) {
							slicedDescription = slicedDescription.slice(0, 128).trim() + '...';
						}
					}
					
					episodes.push({
						id: rawEpisodes[i]['id'],
						index: rawEpisodes[i]['index'],
						title: rawEpisodes[i]['title'],
						description: slicedDescription,
						createdAt: rawEpisodes[i]['createdAt'],
						imageMedia: {
							id: rawEpisodes[i]['imageMedia_id'],
							hash: rawEpisodes[i]['imageMedia_hash'],
							width: rawEpisodes[i]['imageMedia_width'],
							height: rawEpisodes[i]['imageMedia_height']
						}
					});
				}

				response.send(episodes);

				return;
			});
		});
}