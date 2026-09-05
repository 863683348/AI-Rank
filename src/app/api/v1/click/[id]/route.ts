import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, clicks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/click/[id] — 出站跳转 + 防刷计数
 * 同一 IP 哈希对同一 listing 每天只计 1 次（uniq_clicks_ip_day）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [listing] = await db
    .select({ url: listings.url })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const ipHash = createHash('sha256').update(ip + process.env.CLICK_SALT).digest('hex');
  // 北京时间日期
  const day = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

  const inserted = await db
    .insert(clicks)
    .values({ listingId: id, ipHash, day })
    .onConflictDoNothing()
    .returning({ id: clicks.id });

  if (inserted.length > 0) {
    await db
      .update(listings)
      .set({ totalClicks: sql`${listings.totalClicks} + 1` })
      .where(eq(listings.id, id));
  }

  return NextResponse.redirect(listing.url, 302);
}
