import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, listings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/activity — 最近确认出价（公开审计流）
 * 用于「实时统计」页的实时动态列表
 */
export async function GET() {
  const rows = await db
    .select({
      id: bids.id,
      name: listings.name,
      amount: bids.amount,
      method: bids.paymentMethod,
      createdAt: bids.createdAt,
    })
    .from(bids)
    .innerJoin(listings, eq(bids.listingId, listings.id))
    .where(eq(bids.status, 'confirmed'))
    .orderBy(desc(bids.createdAt))
    .limit(20);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      method: r.method,
      createdAt: new Date(r.createdAt).toISOString(),
    }))
  );
}
