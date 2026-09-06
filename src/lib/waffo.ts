import { WaffoPancake, TaxCategory, WebhookEventType } from '@waffo/pancake-ts';

/**
 * Waffo Pancake SDK 封装
 *
 * 环境变量:
 *   WAFFO_MERCHANT_ID  - 商户 ID (MER_ 开头)
 *   WAFFO_PRIVATE_KEY  - RSA 私钥 (PEM 格式)
 *   WAFFO_BASE_URL     - 可选，默认 https://api.waffo.ai
 *
 * V1.2 起主推自定义金额（B 方案）：
 *   - WAFFO_PRODUCT_ID 仅用于「锁定产品版本 + 税务分类」
 *   - 实际收款金额由 priceSnapshot 覆盖（API Key 模式专属能力）
 *   - 调用方必须传 amount（USD），否则按 productId 后台配置价
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
 * V1.2 起：默认按美元（USD）结算，全局以 $ 展示。
 *
 * 自定义金额（B 方案）：传入 `amount` 时，调用 Waffo `priceSnapshot` 覆盖后台产品价。
 * - 仅 API Key 认证（merchantId + RSA）支持 priceSnapshot
 * - taxCategory 必填；AI 工具/SaaS 默认 `TaxCategory.SaaS`
 * - 不传 amount → 退回 productId 后台价（兼容旧调用）
 *
 * @returns { checkoutUrl }
 */
export async function createCheckoutSession(params: {
  productId: string;
  buyerIdentity: string; // 用户唯一 ID
  buyerEmail?: string;
  currency?: string;
  /**
   * 自定义金额（USD）。
   * - 字符串格式 "9.99"，小数点 2 位
   * - 不传 → 用 productId 后台价
   */
  amount?: string;
  /** 税务分类；自定义金额时必填。默认 SaaS（AI 工具/数字商品）。 */
  taxCategory?: TaxCategory;
  metadata?: Record<string, string>;
}): Promise<{ checkoutUrl: string }> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://toolsrank.lol';

  // 构造 priceSnapshot：只在 amount 存在时启用自定义金额
  const priceSnapshot =
    params.amount && params.amount !== ''
      ? {
          amount: params.amount,
          taxCategory: params.taxCategory ?? TaxCategory.SaaS,
        }
      : undefined;

  const result = await client.checkout.authenticated.create({
    productId: params.productId,
    currency: params.currency ?? 'USD',
    buyerIdentity: params.buyerIdentity,
    buyerEmail: params.buyerEmail,
    metadata: params.metadata,
    ...(priceSnapshot ? { priceSnapshot } : {}),
    // 支付成功后的跳转地址
    successUrl: `${appUrl}/success`,
  });

  // SDK unwrapAction 在响应不是 Waffo 标准 envelope（如网关层 404、CDN 拦截）
  // 时不会抛错，而是返回 undefined 字段拼成 `"undefined#token=undefined"`。
  // 这里做完整性校验：URL 必须包含协议 + 有效 token，否则抛错让上层 catch。
  if (
    !result.checkoutUrl ||
    !result.checkoutUrl.startsWith('http') ||
    result.checkoutUrl.includes('undefined') ||
    !result.token
  ) {
    throw new Error(
      `Waffo 返回异常 checkoutUrl（可能 base URL 不可达 / API Key 环境不匹配 / productId 失效）：${result.checkoutUrl ?? '(空)'}`,
    );
  }

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
