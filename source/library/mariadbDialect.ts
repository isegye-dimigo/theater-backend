import { CompiledQuery, DatabaseConnection, DatabaseIntrospector, Dialect, DialectAdapter, DialectAdapterBase, Driver, Kysely, MigrationLockOptions, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, QueryCompiler, QueryResult, TransactionSettings, sql } from 'kysely';
import { Pool, PoolConnection } from 'mariadb';
import { resolveInSequence } from '@library/utility';
import { Readable } from 'stream';
import Logger from '@library/logger';

const release: unique symbol = Symbol('release');

class MariadbConnection implements DatabaseConnection {
	private connection: PoolConnection;
	
	constructor(connection: PoolConnection) {
		this['connection'] = connection;
	}

	public executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
		return this['connection'].query(compiledQuery['sql'], compiledQuery['parameters'])
		.then(function (result: R[] | {
			insertId: bigint;
			affectedRows: number;
		}): QueryResult<R> {
			Logger['logger'].trace(compiledQuery['sql'], '-', compiledQuery['parameters']);

			return 'insertId' in result && 'affectedRows' in result ? {
				insertId: result['insertId'],
				numAffectedRows: BigInt(result['affectedRows']),
				numChangedRows: BigInt(result['affectedRows']),
				rows: []
			} : {
				rows: Array.isArray(result) ? result : []
			};
		});
	}

	public streamQuery<R>(compiledQuery: CompiledQuery<unknown>): AsyncIterableIterator<QueryResult<R>> {
		const queryStream: Readable = this['connection'].queryStream(compiledQuery['sql'], compiledQuery['parameters']);
	
		return {
			[Symbol['asyncIterator']]: function (): AsyncIterableIterator<QueryResult<R>> {
				return this;
			},
			next: function (): Promise<IteratorResult<QueryResult<R>>> {
				return new Promise<IteratorResult<QueryResult<R>>>(function (resolve: ResolveFunction<IteratorResult<QueryResult<R>>>, reject: RejectFunction) {
					queryStream.once('data', function (data: R): void {
						queryStream.removeAllListeners();

						resolve({
							done: false,
							value: {
								rows: [data],
							}
						});

						return;
					})
					.once('end', function (): void {
						resolve({
							done: true,
							value: undefined
						});

						return;
					})
					.once('error', function (error: unknown): void {
						// @ts-expect-error
						if(error['code'] === 'ERR_STREAM_PREMATURE_CLOSE') {
							resolve({
								done: true,
								value: undefined
							});
						} else {
							reject(error);
						}

						return;
					});

					return;
				});
			},
		};
	}

	public [release](): Promise<void> {
		return this['connection'].release();
	}
}

class MariadbDriver implements Driver {
	private pool: Pool;
	private connections: WeakMap<PoolConnection, DatabaseConnection> = new WeakMap<PoolConnection, DatabaseConnection>();

	constructor(pool: Pool) {
		this['pool'] = pool;
	}

	public init(): Promise<void> {
		return Promise.resolve();
	}

	public acquireConnection(): Promise<DatabaseConnection> {
		return this['pool'].getConnection()
		.then((function (this: MariadbDriver, rawConnection: PoolConnection): DatabaseConnection {
			let connection: DatabaseConnection | undefined = this['connections'].get(rawConnection);

			if(typeof(connection) === 'undefined') {
				connection = new MariadbConnection(rawConnection);
				this['connections'].set(rawConnection, connection);
			}

			return connection;
		}).bind(this));
	}
	
	public beginTransaction(connection: MariadbConnection, settings: TransactionSettings): Promise<void> {
		const queryPromises: Promise<QueryResult<unknown>>[] = [];
		
		if(typeof(settings['isolationLevel']) === 'string') {
			queryPromises.push(connection.executeQuery(CompiledQuery.raw('set transaction isolation level ' + settings['isolationLevel'])));
		}

		queryPromises.push(connection.executeQuery(CompiledQuery.raw('begin')));

		return resolveInSequence(queryPromises) as Promise<unknown> as Promise<void>;
	}

	public commitTransaction(connection: MariadbConnection): Promise<void> {
		return connection.executeQuery(CompiledQuery.raw('commit')) as Promise<unknown> as Promise<void>;
	}

	public rollbackTransaction(connection: MariadbConnection): Promise<void> {
		return connection.executeQuery(CompiledQuery.raw('rollback')) as Promise<unknown> as Promise<void>;
	}

	public releaseConnection(connection: MariadbConnection): Promise<void> {
		return connection[release]();
	}

	public destroy(): Promise<void> {
		return this['pool'].end();
	}
}

class MariadbAdapter implements DialectAdapterBase {
	// /dialect/mysql/mysql-adapter.js
	private static readonly LOCK_TIMEOUT_SECONDS: number = 3600;
	private static readonly LOCK_ID: string = 'ea586330-2c93-47c8-908d-981d9d270f9d';

	get supportsReturning(): boolean {
		return true;
	}
	get supportsTransactionalDdl(): boolean {
		return false;
	}
	public acquireMigrationLock(kysely: Kysely<unknown>): Promise<void> {
		return sql`select get_lock(${sql.lit(MariadbAdapter['LOCK_ID'])}, ${sql.lit(MariadbAdapter['LOCK_TIMEOUT_SECONDS'])})`.execute(kysely) as Promise<unknown> as Promise<void>;
	}

	public releaseMigrationLock(kysely: Kysely<unknown>): Promise<void> {
		return sql`select release_lock(${sql.lit(MariadbAdapter['LOCK_ID'])})`.execute(kysely) as Promise<unknown> as Promise<void>;
	}
}

export class MariadbDialect implements Dialect {
	private pool: Pool

	constructor(pool: Pool) {
		this['pool'] = pool;
	}

	public createAdapter(): DialectAdapter {
		return new MariadbAdapter();
	}

	public createDriver(): Driver {
		return new MariadbDriver(this['pool']);
	}

	public createIntrospector(kysely: Kysely<unknown>): DatabaseIntrospector {
		return new MysqlIntrospector(kysely);
	}

	public createQueryCompiler(): QueryCompiler {
		return new MysqlQueryCompiler();
	}
}