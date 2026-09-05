import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split('\n')
  .filter((l) => l.includes('=') && !l.startsWith('#'))
  .reduce((acc, l) => {
    const i = l.indexOf('=');
    acc[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    return acc;
  }, {});

const url = env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const sql = neon(url);

console.log('==> adding columns (if not exists)...');
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`;
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_reason text`;
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false`;

console.log('==> backfilling existing rows to approved...');
const r = await sql`UPDATE listings SET status='approved', verified=true WHERE status='pending' OR status='' OR status IS NULL`;
console.log('   updated rows (affected):', r);

console.log('==> verifying status distribution...');
const dist = await sql`SELECT status, count(*)::int as n FROM listings GROUP BY status ORDER BY n DESC`;
console.table(dist);

process.exit(0);
