import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
await sql`TRUNCATE listings, bids, payments, clicks RESTART IDENTITY CASCADE`;
console.log('已清空 listings/bids/payments/clicks');
