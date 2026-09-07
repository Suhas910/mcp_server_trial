import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

/** Applies schema.sql. Idempotent — every statement is CREATE ... IF NOT EXISTS. */
async function migrate() {
  const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
  await pool.end();
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
