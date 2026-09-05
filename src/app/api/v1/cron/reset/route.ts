import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, dailyResets } from '@/db/schema';
import { sql, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/cron/reset — 每日 00:00（北京时间）重置在榜金额
 * Vercel Cron: UTC 16:00（见 vercel.json）；CRON_SECRET 保护
 * 幂等：daily_resets.reset_date 唯一索引
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const bjDate = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

  const log = await db
    .insert(dailyResets)
    .values({ resetDate: bjDate })
    .onConflictDoNothing({ target: dailyResets.resetDate })
    .returning({ id: dailyResets.id });

  if (log.length === 0) {
    return NextResponse.json({ ok: true, dedup: true, date: bjDate });
  }

  const updated = await db
    .update(listings)
    .set({
      bidAmount: '1.00',
      lastBidAt: new Date(),
      boardVersion: sql`${listings.boardVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(ne(listings.bidAmount, '1.00'))
    .returning({ id: listings.id });

  return NextResponse.json({ ok: true, date: bjDate, resetCount: updated.length });
}

/** POST — 管理端手动触发（同 CRON_SECRET） */
export async function POST(req: NextRequest) {
  return GET(req);
}
