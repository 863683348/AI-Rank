import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const l = await sql`SELECT count(*)::int n FROM listings`;
const b = await sql`SELECT count(*)::int n FROM bids`;
const p = await sql`SELECT count(*)::int n FROM payments`;
const c = await sql`SELECT count(*)::int n FROM clicks`;
console.log('listings/bids/payments/clicks =', l[0].n, b[0].n, p[0].n, c[0].n);
