import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/webhooks/stripe
 * 幂等：payments.external_id 唯一索引 —— 重复回调直接跳过
 * 生效：bid confirmed → listing 累加金额 + board_version+1（触发 SSE 推送）
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const payload = await req.text(); // 必须用 raw body 验签

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bidId = session.metadata?.bidId;
  if (!bidId) return NextResponse.json({ error: 'missing bidId' }, { status: 400 });

  const externalId = (session.payment_intent as string) ?? session.id;

  // 幂等写入：冲突 = 已处理过，直接返回
  const inserted = await db
    .insert(payments)
    .values({
      bidId,
      amount: (session.amount_total! / 100).toFixed(2),
      currency: 'USD',
      paymentMethod: 'stripe',
      externalId,
      status: 'confirmed',
      confirmedAt: new Date(),
    })
    .onConflictDoNothing({ target: payments.externalId })
    .returning({ id: payments.id });

  if (inserted.length === 0) {
    return NextResponse.json({ received: true, dedup: true });
  }

  // 确认 bid
  const [bid] = await db
    .update(bids)
    .set({ status: 'confirmed' })
    .where(eq(bids.id, bidId))
    .returning({ listingId: bids.listingId, amount: bids.amount });

  if (!bid) return NextResponse.json({ error: 'bid not found' }, { status: 404 });

  // 榜单生效：金额累加 + 版本号推进（原子 SQL）
  await db
    .update(listings)
    .set({
      bidAmount: sql`${listings.bidAmount} + ${bid.amount}`,
      lifetimeAmount: sql`${listings.lifetimeAmount} + ${bid.amount}`,
      lastBidAt: new Date(),
      boardVersion: sql`${listings.boardVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, bid.listingId));

  return NextResponse.json({ received: true });
}
