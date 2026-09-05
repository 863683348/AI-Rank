import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, bids, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyWebhookSign } from '@/lib/yungouos';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/webhooks/yungouos
 *
 * YunGouOS 异步回调：用户微信扫码完成 → YunGouOS 推到这里（form-urlencoded）。
 *
 * 设计要点：
 * - 幂等键 payments.externalId = YunGouOS transaction_id（uniq_payments_external 唯一索引兜底）。
 * - 验签失败立即 401，不重试，回调端会主动重推直到成功。
 * - bid.confirmed → listing 金额累加 + boardVersion+1（原子 SQL，与原支付 webhook 一致）。
 */
export async function POST(req: NextRequest) {
  const payload = await readForm(req);

  const notify = verifyWebhookSign(payload);
  if (!notify) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  // outTradeNo 就是 bids.id（前端下单时把 bidId 作为 out_trade_no 透传）
  const bidId = notify.outTradeNo;

  // 幂等写入 payments：重复回调 externalId 相同则直接跳过
  const inserted = await db
    .insert(payments)
    .values({
      bidId,
      amount: notify.totalFee.toFixed(2),
      currency: 'CNY',
      paymentMethod: 'yungouos',
      externalId: notify.transactionId,
      status: 'confirmed',
      confirmedAt: new Date(),
    })
    .onConflictDoNothing({ target: payments.externalId })
    .returning({ id: payments.id });

  if (inserted.length === 0) {
    return NextResponse.json({ code: 0, msg: '已处理' });
  }

  // 确认 bid
  const [bid] = await db
    .update(bids)
    .set({ status: 'confirmed' })
    .where(eq(bids.id, bidId))
    .returning({ listingId: bids.listingId, amount: bids.amount });

  if (!bid) return NextResponse.json({ error: 'bid not found' }, { status: 404 });

  // 榜单生效：金额累加 + 版本号推进（与 SSE 推送联动）
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

  return NextResponse.json({ code: 0, msg: '成功' });
}

// YunGouOS 用 application/x-www-form-urlencoded 推送，但有时也会用 multipart，
// 这里把两种都解码出来，合成一个扁平的字符串字典。
async function readForm(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const out: Record<string, string> = {};
    form.forEach((v, k) => {
      out[k] = typeof v === 'string' ? v : '';
    });
    return out;
  }
  // 兜底：当成 form-urlencoded 解析
  const text = await req.text();
  return Object.fromEntries(new URLSearchParams(text).entries());
}
