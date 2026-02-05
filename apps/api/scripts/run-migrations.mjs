#!/usr/bin/env node
/**
 * Run schema + migrations with Node (no psql required).
 * From repo root: npm run db:run-sql -w apps/api
 * From apps/api:  node scripts/run-migrations.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');
const repoRoot = join(apiRoot, '..', '..');

// Load .env from repo root or apps/api
[repoRoot, apiRoot].forEach((dir) => {
  const p = join(dir, '.env');
  if (existsSync(p)) config({ path: p });
});

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it in .env or environment.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

async function runSql(name, sql) {
  try {
    await client.query(sql);
    console.log('OK:', name);
  } catch (e) {
    console.error('FAIL:', name, e.message);
    throw e;
  }
}

async function main() {
  await client.connect();
  try {
    const schemaPath = join(apiRoot, 'src', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await runSql('schema.sql', schema);

    const migrationsDir = join(apiRoot, 'src', 'db', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const f of files) {
      const sql = readFileSync(join(migrationsDir, f), 'utf8');
      await runSql(f, sql);
    }
    console.log('All migrations finished.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
