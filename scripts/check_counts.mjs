import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const l = await sql`SELECT count(*)::int AS n FROM listings`;
const b = await sql`SELECT count(*)::int AS n FROM bids`;
const c = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log('listings:', l[0].n);
console.log('bids   :', b[0].n);
console.log('tables :', c.map(x=>x.table_name).join(', '));
