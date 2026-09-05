import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createNativeOrder } from '@/lib/yungouos';
import { createCheckoutSession } from '@/lib/waffo';

export const dynamic = 'force-dynamic';

/** POST /api/v1/listings/[id]/bid — 已上榜工具加价（创建待支付 bid → 微信扫码） */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { amount?: number; channel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const amount = Number(body.amount);
  const channel = (body.channel as string) ?? 'yungouos';
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return NextResponse.json({ error: '竞价金额范围 1 - 100000' }, { status: 400 });
  }

  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [bid] = await db
    .insert(bids)
    .values({ listingId: id, amount: amount.toFixed(2), paymentMethod: channel === 'waffo' ? 'waffo' : 'yungouos' })
    .returning();

  if (channel === 'waffo') {
    const productId = process.env.WAFFO_PRODUCT_ID ?? '';
    if (!productId) {
      return NextResponse.json({ error: 'Waffo 未配置 WAFFO_PRODUCT_ID' }, { status: 500 });
    }
    const result = await createCheckoutSession({
      productId,
      buyerIdentity: bid.id,
      metadata: { listingId: id, bidId: bid.id, amount: amount.toFixed(2), name: listing.name },
    });
    return NextResponse.json({ checkoutUrl: result.checkoutUrl, bidId: bid.id });
  }

  const order = await createNativeOrder({
    outTradeNo: bid.id,
    amount,
    body: `${listing.name} 加价 ¥${amount}`,
    attach: JSON.stringify({ listingId: id, bidId: bid.id }),
    channel: 'merge',
  });

  return NextResponse.json({
    codeUrl: order.codeUrl,
    qrCodeImgUrl: order.qrCodeImgUrl,
    bidId: bid.id,
  });
}
