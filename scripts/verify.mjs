import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const c = await sql`SELECT
  (SELECT count(*) FROM listings) listings,
  (SELECT count(*) FROM bids WHERE status='confirmed') bids_conf,
  (SELECT count(*) FROM payments WHERE status='confirmed') pays_conf,
  (SELECT count(*) FROM clicks) clicks,
  (SELECT coalesce(sum(cast(bid_amount as numeric)),0) FROM listings) on_board,
  (SELECT coalesce(sum(cast(lifetime_amount as numeric)),0) FROM listings) lifetime,
  (SELECT coalesce(sum(total_clicks),0) FROM listings) total_clicks`;

console.log('汇总:', JSON.stringify(c[0]));

const cats = await sql`SELECT category, count(*)::int n, coalesce(sum(cast(bid_amount as numeric)),0) sum FROM listings GROUP BY category ORDER BY category`;
console.log('\n分类分布:');
for (const r of cats) console.log(`  ${r.category.padEnd(14)} n=${r.n}  在榜总额=${Number(r.sum)}`);

const top = await sql`SELECT name, category, bid_amount, rank() OVER (ORDER BY cast(bid_amount as numeric) DESC, last_bid_at DESC) rk FROM listings ORDER BY rk LIMIT 5`;
console.log('\nTop5 (按金额+时间):');
for (const r of top) console.log(`  #${r.rk} ${r.name} [${r.category}] ¥${r.bid_amount}`);

const act = await sql`SELECT count(*)::int n FROM bids WHERE status='confirmed'`;
console.log('\n活动流(confirmed bids):', act[0].n);
