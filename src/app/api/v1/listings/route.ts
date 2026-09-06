import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/waffo';
import { validateUrl, scanSafety, decideStatus } from '@/lib/listingGuard';
import { notifyNewPending } from '@/lib/notify';

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
      verified: listings.verified,
    })
    .from(listings)
    .where(eq(listings.status, 'approved'))
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

  // 阶段1：URL 硬校验 + 内容安全扫描
  const urlCheck = validateUrl(url);
  if (!urlCheck.ok) return NextResponse.json({ error: urlCheck.reason ?? '链接不合法' }, { status: 400 });
  const nameSafety = scanSafety(name);
  if (!nameSafety.ok) return NextResponse.json({ error: nameSafety.reason ?? '名称含违规内容' }, { status: 400 });
  const descSafety = scanSafety(body.description ?? '');
  if (!descSafety.ok) return NextResponse.json({ error: descSafety.reason ?? '描述含违规内容' }, { status: 400 });

  // 阶段2：可信域名自动放行，其余落人工审核（真正兜底闸门在 /admin）
  const { status, verified } = decideStatus(url);

  // 同 URL 幂等：数据库唯一索引 uniq_listings_url 兜底，冲突时 409 引导加价
  try {
    const [listing] = await db
      .insert(listings)
      .values({
        url,
        name,
        description: body.description?.slice(0, 200) ?? null,
        iconUrl: body.iconUrl ?? null,
        bidAmount: status === 'approved' ? amount.toFixed(2) : '1.00',
        lifetimeAmount: status === 'approved' ? amount.toFixed(2) : '1.00',
        status,
        verified,
      })
      .returning();

    // 待人工审核：不创建支付，提示等待审核
    if (status === 'pending') {
      // 通知审核人（失败不影响主流程，notify 内部 try/catch）
      void notifyNewPending({
        listingId: listing.id,
        name,
        url,
        category: body.category,
      });
      return NextResponse.json({
        status: 'pending',
        message: '已提交，待人工审核。审核通过后即可支付上 C 位，我们会尽快处理。',
        listingId: listing.id,
      });
    }

    const [bid] = await db
      .insert(bids)
      .values({ listingId: listing.id, amount: amount.toFixed(2), paymentMethod: (body.channel ?? 'waffo') === 'waffo' ? 'waffo' : 'yungouos' })
      .returning();

    const channel = (body.channel as string) ?? 'waffo';

    // 根据渠道选择支付提供商
    if (channel === 'waffo') {
      // Waffo：跳转到托管结账页，需要 productId
      const productId = process.env.WAFFO_PRODUCT_ID ?? '';
      if (!productId) {
        return NextResponse.json({ error: 'Waffo 未配置 WAFFO_PRODUCT_ID' }, { status: 500 });
      }
      try {
        const result = await createCheckoutSession({
          productId,
          buyerIdentity: bid.id,
          // 必传 amount：用竞价金额实时覆盖产品后台价（priceSnapshot B 方案）
          amount: amount.toFixed(2),
          metadata: { listingId: listing.id, bidId: bid.id, amount: amount.toFixed(2), name },
        });
        return NextResponse.json({ checkoutUrl: result.checkoutUrl, listingId: listing.id, bidId: bid.id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[listings POST] Waffo checkout failed:', msg);
        // 回滚刚创建的 bid（未支付成功，留着会污染榜单统计）
        await db.delete(bids).where(eq(bids.id, bid.id));
        return NextResponse.json(
          { error: '支付通道暂时不可用，请稍后重试', detail: msg },
          { status: 502 },
        );
      }
    }

    // YunGouOS 已弃用：V1.2 起主推 Waffo 美元通道；保留代码以兼容历史请求
    return NextResponse.json(
      { error: '国内支付已下线，请用 Waffo 国际卡支付（Visa/Master/海外钱包）' },
      { status: 410 },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Drizzle 把底层 pg 错误包成 DrizzleQueryError，message 只含 SQL 文本。
    // 真实的 unique violation 在 e.cause.message 里（如 uniq_listings_url），
    // 这里把 cause.message 也拼进来匹配。
    const cause = e instanceof Error && 'cause' in e ? (e as { cause?: { message?: string; code?: string } }).cause : null;
    const causeMsg = cause?.message ?? '';
    const pgCode = cause?.code ?? (e as { code?: string })?.code;
    const combined = `${msg} ${causeMsg}`;
    if (combined.includes('uniq_listings_url') || pgCode === '23505') {
      return NextResponse.json({ error: '该 URL 已在榜单，请直接加价' }, { status: 409 });
    }
    console.error('[listings POST] unhandled:', msg, '| cause:', causeMsg);
    return NextResponse.json({ error: '创建失败', detail: msg }, { status: 500 });
  }
}
