import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const [{ id }] = await sql`SELECT id FROM listings LIMIT 1`;
console.log('got id', id);
const BJ = '2026-09-05';
const vals = [`( '${id}', 't-0', '${BJ}' )`, `( '${id}', 't-1', '${BJ}' )`];
const stmt = 'INSERT INTO clicks (listing_id, ip_hash, day) VALUES ' + vals.join(',');
try {
  const r = await sql.unsafe(stmt);
  console.log('unsafe(string) ok, affected:', JSON.stringify(r));
  const [{ n }] = await sql`SELECT count(*)::int n FROM clicks WHERE listing_id = ${id}`;
  console.log('clicks for this id now:', n);
} catch (e) {
  console.log('unsafe ERROR:', e && e.message);
}
