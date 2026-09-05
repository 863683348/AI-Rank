import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, name, url, description, category, bid_amount
  FROM listings
  ORDER BY bid_amount::numeric DESC
`;

console.log('TOTAL:', rows.length);
for (const r of rows) {
  console.log('---');
  console.log('id        :', r.id);
  console.log('name      :', r.name);
  console.log('url       :', r.url);
  console.log('cat       :', r.category);
  console.log('desc      :', r.description);
}
