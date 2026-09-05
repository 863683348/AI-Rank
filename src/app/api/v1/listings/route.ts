import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { createCheckout } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/** GET /api/v1/listings — 榜单（金额降序，同额后出价者优先） */
export async function GET() {
  const rows = await db
    .select({
      id: listings.id,
      url: listings.url,
      name: listings.name,
      description: listings.description,
      iconUrl: listings.iconUrl,
      bidAmount: listings.bidAmount,
      lifetimeAmount: listings.lifetimeAmount,
      totalClicks: listings.totalClicks,
      lastBidAt: listings.lastBidAt,
    })
    .from(listings)
    .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
    .limit(100);

  return NextResponse.json({ listings: rows });
}

/** POST /api/v1/listings — 新工具上架（创建 listing + 待支付 bid → Stripe Checkout） */
export async function POST(req: NextRequest) {
  let body: { url?: string; name?: string; description?: string; iconUrl?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const url = (body.url ?? '').trim();
  const name = (body.name ?? '').trim();
  const amount = Number(body.amount ?? 1);

  if (!/^https:\/\/.+\..+/.test(url)) {
    return NextResponse.json({ error: 'url 必须是 https 链接' }, { status: 400 });
  }
  if (!name || name.length > 60) {
    return NextResponse.json({ error: 'name 必填且不超过 60 字' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return NextResponse.json({ error: '竞价金额范围 1 - 100000' }, { status: 400 });
  }

  // 同 URL 幂等：数据库唯一索引 uniq_listings_url 兜底，冲突时 409 引导加价
  try {
    const [listing] = await db
      .insert(listings)
      .values({
        url,
        name,
        description: body.description?.slice(0, 200) ?? null,
        iconUrl: body.iconUrl ?? null,
        bidAmount: amount.toFixed(2),
        lifetimeAmount: amount.toFixed(2),
      })
      .returning();

    const [bid] = await db
      .insert(bids)
      .values({ listingId: listing.id, amount: amount.toFixed(2), paymentMethod: 'stripe' })
      .returning();

    const origin = req.headers.get('origin') ?? new URL(req.url).origin;
    const checkout = await createCheckout({
      bidId: bid.id,
      amount,
      name,
      origin,
    });

    return NextResponse.json({ checkoutUrl: checkout.url, listingId: listing.id, bidId: bid.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('uniq_listings_url')) {
      return NextResponse.json({ error: '该 URL 已在榜单，请直接加价' }, { status: 409 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
