import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook, getClient } from '@/lib/waffo';
import { db } from '@/db';
import { listings, bids, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const POST = async (req: NextRequest) => {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-waffo-signature');
  const parsed = verifyWebhook(rawBody, signatureHeader);
  if (!parsed) {
    return NextResponse.json({ error: 'invalid signature or event' }, { status: 401 });
  }
  const { event, eventType } = parsed;
  const evt = event as Record<string, unknown>;
  // 幂等：已处理过的事件直接返回 200
  const orderId = (evt.orderId as string) ?? null;
  const paymentId = (evt.paymentId as string) ?? null;
  const externalId = orderId ?? paymentId;
  if (externalId) {
    const [existing] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.externalId, externalId))
      .limit(1);
    if (existing) {
      return NextResponse.json({ received: true });
    }
  }
  try {
    if (eventType === 'order.completed') {
      await handleOrderCompleted(evt);
    } else if (eventType === 'refund.succeeded' || eventType === 'refund.failed') {
      await handleRefund(evt);
    }
    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    console.error('Waffo webhook handler error:', e);
    return NextResponse.json({ error: 'handler error' }, { status: 500 });
  }
};

async function handleOrderCompleted(evt: Record<string, unknown>) {
  const attach = (evt.attach as string | null) ?? null;
  let meta: { listingId?: string; bidId?: string; externalId?: string } | null = null;
  try {
    meta = attach ? JSON.parse(attach) : null;
  } catch {
    meta = null;
  }
  const bidId = meta?.bidId ?? (evt.orderMerchantExternalId as string) ?? null;
  const listingId = meta?.listingId ?? null;
  const amountStr = (evt.amount as string) ?? '0';
  const currency = (evt.currency as string) ?? 'CNY';
  const paymentId = (evt.paymentId as string) ?? null;
  const paymentMethod = 'waffo';
  const status = 'confirmed';
  if (bidId) {
    const [bid] = await db
      .select({ id: bids.id, listingId: bids.listingId, amount: bids.amount })
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);
    if (!bid) throw new Error(`bid not found: ${bidId}`);
    const finalBidId = bid.listingId ? bid.listingId : bidId;
    const actualListingId = listingId ?? bid.listingId ?? null;
    await db
      .insert(payments)
      .values({
        bidId,
        amount: amountStr,
        currency,
        paymentMethod,
        status,
        externalId: paymentId ?? null,
      });
    if (actualListingId) {
      await db
        .update(listings)
        .set({
          // V1.3.1：listing 初始 bidAmount=0（未支付不占榜），首笔确认累加即不重复；
          // 同时置 paid=true —— 支付门控放行，进榜单可见
          bidAmount: sql`${listings.bidAmount} + ${amountStr}`,
          lifetimeAmount: sql`${listings.lifetimeAmount} + ${amountStr}`,
          lastBidAt: sql`now() AT TIME ZONE 'Asia/Shanghai'`,
          boardVersion: sql`${listings.boardVersion} + 1`,
          paid: true,
        })
        .where(eq(listings.id, actualListingId));
    }
  } else if (listingId) {
    await db
      .insert(payments)
      .values({
        bidId: null,
        amount: amountStr,
        currency,
        paymentMethod,
        status,
        externalId: paymentId ?? null,
        listingId,
      });
  }
}

async function handleRefund(evt: Record<string, unknown>) {
  const refundId = (evt.refundId as string) ?? null;
  const paymentId = (evt.paymentId as string) ?? null;
  const amount = (evt.amount as string) ?? '0';
  const reason = (evt.refundReason as string) ?? null;
  await db
    .insert(payments)
    .values({
      bidId: null,
      amount,
      currency: (evt.currency as string) ?? 'CNY',
      paymentMethod: 'waffo',
      status: 'refunded',
      externalId: refundId ?? paymentId,
    });
}
