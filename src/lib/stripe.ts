import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }
  return stripeClient;
}

/**
 * 创建 Stripe Checkout Session。
 * MVP 简化：Stripe 渠道按同面额美元收取（¥10 → $10），
 * 数据库记录的金额仍以 CNY 计，用于榜单排序。
 * WECHAT_ENABLED=false 时微信入口隐藏。
 */
export async function createCheckout(opts: {
  bidId: string;
  amount: number; // CNY 面额，同时作为 USD 结算面额（MVP 简化）
  name: string;
  origin: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(opts.amount * 100),
          product_data: { name: `Bid: ${opts.name}` },
        },
      },
    ],
    metadata: { bidId: opts.bidId },
    success_url: `${opts.origin}/pay/success?bid=${opts.bidId}`,
    cancel_url: `${opts.origin}/`,
  });
  if (!session.url) throw new Error('Stripe session missing url');
  return { url: session.url };
}
