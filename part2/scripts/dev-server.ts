/**
 * Boots the API against PGlite for manual/E2E verification (see smoke-test.ts
 * for the automated version). Not used in production — that's `npm run dev`
 * against a real DATABASE_URL.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DB_PORT = Number(process.env.DEV_DB_PORT ?? 5434);
const API_PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  const dbServer = new PGLiteSocketServer({ db, port: DB_PORT, host: '127.0.0.1' });
  await dbServer.start();

  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
  process.env.JWT_SECRET ??= 'dev-secret-not-for-production';
  process.env.CORS_ORIGIN ??= 'http://localhost:5173';
  process.env.PG_POOL_MAX = '1';
  process.env.PORT = String(API_PORT);

  const schema = await readFile(fileURLToPath(new URL('../src/db/schema.sql', import.meta.url)), 'utf8');
  await db.exec(schema);
  console.log(`PGlite schema applied (dev db on 127.0.0.1:${DB_PORT})`);

  await import('../src/index.js');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
