import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { createNativeOrder } from '@/lib/yungouos';
import { createCheckoutSession } from '@/lib/waffo';

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

/** POST /api/v1/listings — 新工具上架（创建 listing + 待支付 bid → 微信扫码） */
export async function POST(req: NextRequest) {
  let body: { url?: string; name?: string; description?: string; iconUrl?: string; amount?: number; channel?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const url = (body.url ?? '').trim();
  const name = (body.name ?? '').trim();
  const amount = Number(body.amount ?? 1);
  const category = body.category && /^[a-z0-9-]{2,20}$/.test(body.category) ? body.category : 'ai-tools';

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
      .values({ listingId: listing.id, amount: amount.toFixed(2), paymentMethod: body.channel === 'waffo' ? 'waffo' : 'yungouos' })
      .returning();

    const channel = (body.channel as string) ?? 'yungouos';

    // 根据渠道选择支付提供商
    if (channel === 'waffo') {
      // Waffo：跳转到托管结账页，需要 productId
      const productId = process.env.WAFFO_PRODUCT_ID ?? '';
      if (!productId) {
        return NextResponse.json({ error: 'Waffo 未配置 WAFFO_PRODUCT_ID' }, { status: 500 });
      }
      const result = await createCheckoutSession({
        productId,
        buyerIdentity: bid.id,
        metadata: { listingId: listing.id, bidId: bid.id, amount: amount.toFixed(2), name },
      });
      return NextResponse.json({ checkoutUrl: result.checkoutUrl, listingId: listing.id, bidId: bid.id });
    }

    // YunGouOS：生成二维码（一码付，微信/支付宝通用）
    const order = await createNativeOrder({
      outTradeNo: bid.id,
      amount,
      body: `${name} 上榜 ¥${amount}`,
      attach: JSON.stringify({ listingId: listing.id, bidId: bid.id }),
      channel: 'merge',
    });

    return NextResponse.json({
      codeUrl: order.codeUrl,
      qrCodeImgUrl: order.qrCodeImgUrl,
      listingId: listing.id,
      bidId: bid.id,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('uniq_listings_url')) {
      return NextResponse.json({ error: '该 URL 已在榜单，请直接加价' }, { status: 409 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
