import { NextResponse } from 'next/server';

/**
 * POST /api/v1/payments/stripe — 禁用
 *
 * 历史原因：v1.0 写 Spec 时按 Stripe + 微信双支付；实际 MVP 已切到 YunGouOS 聚合支付（+ Waffo 可选）。
 * 保留路由路径仅为不让外部链接断链；所有方法返 501 防止误调用。
 * 替换说明：见 src/app/api/v1/payments/stripe/route.ts 注释与 Spec v1.1 §13 变更记录。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'disabled',
      message: 'Stripe 支付已下线，请使用 YunGouOS（默认）或 Waffo 通道（见 /api/v1/listings 的 channel 参数）',
      replacement: { yungouos: '/api/v1/webhooks/yungouos', waffo: '/api/v1/webhooks/waffo' },
    },
    { status: 501 }
  );
}

export async function GET() {
  return POST();
}

export async function PUT() {
  return POST();
}

export async function DELETE() {
  return POST();
}

export async function PATCH() {
  return POST();
}