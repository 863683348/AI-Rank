import { NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/stats — 榜单聚合指标
 * 返回：条目数 / 在榜总额 / 累计投入 / 累计点击 / 今日（北京时间）出价笔数 / 今日金额
 */
export async function GET() {
  const [agg] = await db
    .select({
      listings: sql<number>`count(*)`,
      onBoard: sql<number>`coalesce(sum(cast(${listings.bidAmount} as numeric)), 0)`,
      lifetime: sql<number>`coalesce(sum(cast(${listings.lifetimeAmount} as numeric)), 0)`,
      clicks: sql<number>`coalesce(sum(${listings.totalClicks}), 0)`,
    })
    .from(listings);

  // 北京时间今日 00:00 对应的真实 UTC 毫秒
  const bjNow = new Date(Date.now() + 8 * 3600_000);
  bjNow.setUTCHours(0, 0, 0, 0);
  const bjStart = new Date(bjNow.getTime() - 8 * 3600_000);

  const [today] = await db
    .select({
      bids: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(cast(${bids.amount} as numeric)), 0)`,
    })
    .from(bids)
    .where(gte(bids.createdAt, bjStart));

  const bjDate = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

  return NextResponse.json({
    listings: Number(agg.listings),
    onBoard: Number(agg.onBoard),
    lifetime: Number(agg.lifetime),
    clicks: Number(agg.clicks),
    todayBids: Number(today.bids),
    todayAmount: Number(today.amount),
    bjDate,
  });
}
