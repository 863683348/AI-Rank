import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/waffo';
import { TaxCategory } from '@waffo/pancake-ts';

export const dynamic = 'force-dynamic';

/** 复用 admin 鉴权逻辑（仅运营） */
function authed(req: NextRequest): boolean {
  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const q = new URL(req.url).searchParams.get('token');
  const t = header || q;
  return !!t && t === process.env.ADMIN_TOKEN;
}

/**
 * POST /api/v1/admin/test-waffo — Waffo 连通性诊断
 *
 * 输出：
 * - config: 关键环境变量状态（仅前缀 + 布尔）
 * - raw   : 直接打 Waffo base URL 看响应（无 RSA 签名，验服务器连通性）
 * - sdk   : 走完整 SDK 调用，含 RSA 签名 + priceSnapshot（重现真实下单路径）
 *
 * body: { amount?: string }   默认 "9.99"
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { amount?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* 空 body 也允许 */
  }
  const amount = (body.amount ?? '9.99').toString().slice(0, 8);

  const config = {
    baseUrl: process.env.WAFFO_BASE_URL ?? '(未配置 → 默认 https://api.waffo.ai)',
    merchantIdPrefix: process.env.WAFFO_MERCHANT_ID ? process.env.WAFFO_MERCHANT_ID.slice(0, 12) + '…' : '(未配置)',
    productIdPrefix: process.env.WAFFO_PRODUCT_ID ? process.env.WAFFO_PRODUCT_ID.slice(0, 14) + '…' : '(未配置)',
    hasPrivateKey: !!process.env.WAFFO_PRIVATE_KEY,
    privateKeyLen: process.env.WAFFO_PRIVATE_KEY?.length ?? 0,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? '(未配置)',
  };

  // ── 1) raw 探测：不带签名打 create-session，看服务器对未知请求如何回应 ──
  // 用于区分「连不上」「鉴权问题」「路由不存在」三种情况。
  let raw: { status: number; statusText: string; body: string; url: string } | null = null;
  let rawError: string | null = null;
  try {
    const baseUrl = process.env.WAFFO_BASE_URL ?? 'https://api.waffo.ai';
    const url = `${baseUrl}/v1/actions/checkout/create-session`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Id': process.env.WAFFO_MERCHANT_ID ?? '',
      },
      body: JSON.stringify({ probe: 'admin-test', ts: Date.now() }),
      // 5 秒超时，避免 sandbox 挂起
      signal: AbortSignal.timeout(5_000),
    });
    raw = {
      status: resp.status,
      statusText: resp.statusText,
      body: (await resp.text()).slice(0, 3000),
      url,
    };
  } catch (e) {
    rawError = e instanceof Error ? e.message : String(e);
  }

  // ── 2) SDK 真实路径：带 RSA 签名 + priceSnapshot，模拟一次完整下单 ──
  let sdk: { success: true; checkoutUrl: string } | { success: false; error: string } | null = null;
  if (!process.env.WAFFO_PRODUCT_ID) {
    sdk = { success: false, error: 'WAFFO_PRODUCT_ID 未配置，无法走 SDK 路径' };
  } else {
    try {
      const r = await createCheckoutSession({
        productId: process.env.WAFFO_PRODUCT_ID,
        buyerIdentity: 'admin-probe-' + Date.now(),
        amount,
        taxCategory: TaxCategory.SaaS,
        metadata: { source: 'admin-test' },
      });
      sdk = { success: true, checkoutUrl: r.checkoutUrl };
    } catch (e) {
      sdk = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    amount,
    config,
    raw: {
      probe: raw,
      probeError: rawError,
      note: '不带签名打 create-session，用来定位 4xx/5xx/网络错，不应成功',
    },
    sdk,
    hint: sdk && !sdk.success ? '看 raw 段确认服务器响应；返回 401/403 = Key 环境不匹配；404 = 路由不存在；200 + JSON error = 鉴权未过' : undefined,
  });
}
