import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
const sql = neon(process.env.DATABASE_URL);
const id = randomUUID();
const ph = '( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )';
const params = [id, 'https://x.test', 'X', 'other', '1.00', '1.00', new Date().toISOString(), 0, 1];
try {
  const r = await sql.query(`INSERT INTO listings (id, url, name, category, bid_amount, lifetime_amount, last_bid_at, total_clicks, board_version) VALUES ${ph}`, params);
  console.log('query insert ok, result keys:', Object.keys(r));
} catch (e) {
  console.log('query insert ERROR:', e && e.message);
}
const c1 = await sql`SELECT count(*)::int n FROM listings`;
console.log('SAME process count:', c1[0].n);
await sql`DELETE FROM listings WHERE id = ${id}`;
const c2 = await sql`SELECT count(*)::int n FROM listings`;
console.log('after delete:', c2[0].n);
