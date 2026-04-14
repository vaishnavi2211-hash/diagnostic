import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('pg').Pool | ReturnType<typeof createSerialPglitePool>} */
export let pool;

function createSerialPglitePool(db) {
  let chain = Promise.resolve();
  const enqueue = (fn) => {
    const run = () => fn();
    const next = chain.then(run, run);
    chain = next.catch(() => {});
    return next;
  };
  return {
    query: (text, params) => enqueue(() => db.query(text, params)),
    connect: async () => ({
      query: (text, params) => enqueue(() => db.query(text, params)),
      release: () => {},
    }),
    on: () => {},
  };
}

export async function initDb() {
  if (process.env.USE_PGLITE === '1') {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite();
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(sql);
    pool = createSerialPglitePool(db);
    console.log('Database: PGlite (embedded, USE_PGLITE=1)');
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required unless USE_PGLITE=1');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PG pool error', err);
  });

  console.log('Database: PostgreSQL');
}
