import pg from 'pg';
import { config } from '../config.js';

// timestamptz -> ISO string, so the API emits the same `createdAt` shape the
// frontend already expects instead of a JS Date that JSON.stringify reformats.
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (value) => new Date(value).toISOString());

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: config.pgPoolMax });

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Run `fn` inside a transaction, rolling back if it throws. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
