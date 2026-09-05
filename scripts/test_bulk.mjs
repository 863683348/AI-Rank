import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
const sql = neon(process.env.DATABASE_URL);

const rows = [
  { id: randomUUID(), url: 'https://bulk-a.test', name: 'BulkA', category: 'other', bid_amount: '1.00', lifetime_amount: '1.00', last_bid_at: new Date().toISOString(), total_clicks: 0, board_version: 1 },
  { id: randomUUID(), url: 'https://bulk-b.test', name: 'BulkB', category: 'other', bid_amount: '2.00', lifetime_amount: '2.00', last_bid_at: new Date().toISOString(), total_clicks: 0, board_version: 1 },
];
try {
  const r = await sql`INSERT INTO listings ${rows} RETURNING id, name`;
  console.log('bulk ok:', JSON.stringify(r));
  await sql`DELETE FROM listings WHERE url LIKE 'https://bulk-%'`;
  console.log('cleaned');
} catch (e) {
  console.log('bulk ERROR:', e && e.message);
}
