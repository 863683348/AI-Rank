import { WaffoPancake, WebhookEventType } from '@waffo/pancake-ts';

/**
 * Waffo Pancake SDK 封装
 *
 * 环境变量:
 *   WAFFO_MERCHANT_ID  - 商户 ID (MER_ 开头)
 *   WAFFO_PRIVATE_KEY  - RSA 私钥 (PEM 格式)
 *   WAFFO_BASE_URL     - 可选，默认 https://api.waffo.ai
 */

let _client: WaffoPancake | null = null;

export function getClient(): WaffoPancake {
  if (!_client) {
    const merchantId = process.env.WAFFO_MERCHANT_ID;
    const privateKey = process.env.WAFFO_PRIVATE_KEY;
    if (!merchantId || !privateKey) {
      throw new Error('WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY 未配置');
    }
    _client = new WaffoPancake({
      merchantId,
      privateKey,
      baseUrl: process.env.WAFFO_BASE_URL ?? 'https://api.waffo.ai',
    });
  }
  return _client;
}

/**
 * 创建 Checkout Session
 *
 * V1.2 起：默认按美元（USD）结算，zh 显示按汇率换算成 ¥。
 * @returns { checkoutUrl }
 */
export async function createCheckoutSession(params: {
  productId: string;
  buyerIdentity: string; // 用户唯一 ID
  buyerEmail?: string;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<{ checkoutUrl: string }> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://toolsrank.ai';
  const result = await client.checkout.authenticated.create({
    productId: params.productId,
    currency: params.currency ?? 'USD',
    buyerIdentity: params.buyerIdentity,
    buyerEmail: params.buyerEmail,
    metadata: params.metadata,
    // 支付成功后的跳转地址
    successUrl: `${appUrl}/success`,
  });
  return { checkoutUrl: result.checkoutUrl };
}

/**
 * 验证 Waffo Webhook 签名并解析事件
 * 返回 null 表示验签失败或不是已知事件类型
 */
export function verifyWebhook(
  rawBody: string,
  signatureHeader: string | undefined | null,
): { event: unknown; eventType: string } | null {
  try {
    const client = getClient();
    const event = client.webhooks.verify(rawBody, signatureHeader);
    // 只处理我们关心的事件
    const allowedEvents = new Set<string>([
      WebhookEventType.OrderCompleted,
      WebhookEventType.RefundSucceeded,
      WebhookEventType.RefundFailed,
      WebhookEventType.SubscriptionActivated,
      WebhookEventType.SubscriptionPaymentSucceeded,
      WebhookEventType.SubscriptionCanceled,
    ]);
    if (!allowedEvents.has(event.eventType as string)) {
      return null;
    }
    return { event, eventType: event.eventType as string };
  } catch {
    // 验签失败
    return null;
  }
}
