import { NextResponse } from 'next/server';

/**
 * POST /api/v1/webhooks/wechat — 禁用
 *
 * 微信支付直连通道未启用（个人主体无微信商户号）。MVP 走 YunGouOS 聚合支付的 merge 一码付（覆盖微信扫码）。
 * 保留路由仅为不让外部链接断链；所有方法返 501 防止误推。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'disabled',
      message: '微信直连通道未启用，请使用 YunGouOS 一码付（merge）通道，回调已迁到 /api/v1/webhooks/yungouos',
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({ error: 'disabled' }, { status: 501 });
}