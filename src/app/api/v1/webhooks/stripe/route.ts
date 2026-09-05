import { NextResponse } from 'next/server';

/**
 * POST /api/v1/webhooks/stripe — 禁用
 *
 * Stripe 通道已下线（v1.0 Spec → v1.1 改用 YunGouOS 聚合支付）。
 * 保留路由仅为不让旧 Stripe webhook 配置断链；所有方法返 401/501 防止误推与误调。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'disabled',
      message: 'Stripe webhook 已下线，请将回调地址改为 /api/v1/webhooks/yungouos 或 /api/v1/webhooks/waffo',
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({ error: 'disabled' }, { status: 501 });
}