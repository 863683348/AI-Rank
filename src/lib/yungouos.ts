/**
 * YunGouOS 聚合支付客户端（v1 接口）。
 *
 * 支持三种 channel：
 *   - merge   （默认）一码付：一个二维码，微信、支付宝都能扫，用户用哪个都行。
 *   - wechat  微信扫码（wxpay 商户）
 *   - alipay  支付宝扫码（alipay 商户）
 *
 * 设计原则：
 * - 上层只依赖 createNativeOrder / verifyWebhookSign / queryOrder 三个方法；
 *   后面切到微信官方 V3 / 支付宝 openapi 直连（A 路径）时只需替换本实现。
 * - 签名：字典按键名字母序升序 → key1=val1&key2=val2&...&key=PAY_KEY → MD5 大写。
 *   字典里的 sign 字段不参与签名。
 * - 环境变量全部明文，无加密（用户偏好）。
 *
 * 必备环境变量（merge 一码付时，mch_id / pay_key 填「聚合支付」商户号与密钥）：
 *   YUNGOUOS_MCH_ID      商户号（聚合支付商户号）
 *   YUNGOUOS_PAY_KEY     商户支付密钥（明文）
 *   YUNGOUOS_NOTIFY_URL  异步回调地址（https 公网）
 *   YUNGOUOS_API_BASE    可选，默认 https://api.pay.yungouos.com
 */

const API_BASE = process.env.YUNGOUOS_API_BASE ?? 'https://api.pay.yungouos.com';

export type PayChannel = 'merge' | 'wechat' | 'alipay';

const CHANNEL_ENDPOINT: Record<PayChannel, string> = {
  merge: '/api/pay/merge/nativePay',
  wechat: '/api/pay/wxpay/nativePay',
  alipay: '/api/pay/alipay/nativePay',
};

const CHANNEL_QUERY_ENDPOINT: Record<PayChannel, string> = {
  merge: '/api/pay/merge/getPayOrder',
  wechat: '/api/pay/wxpay/getPayOrder',
  alipay: '/api/pay/alipay/getPayOrder',
};

export type YunGouOSConfig = {
  mchId: string;
  payKey: string;
  notifyUrl: string;
};

function getConfig(): YunGouOSConfig {
  const mchId = process.env.YUNGOUOS_MCH_ID;
  const payKey = process.env.YUNGOUOS_PAY_KEY;
  const notifyUrl = process.env.YUNGOUOS_NOTIFY_URL;
  if (!mchId || !payKey || !notifyUrl) {
    throw new Error(
      'YunGouOS 未配置：请在 .env 填写 YUNGOUOS_MCH_ID / YUNGOUOS_PAY_KEY / YUNGOUOS_NOTIFY_URL'
    );
  }
  return { mchId, payKey, notifyUrl };
}

/** 按字母序升序拼接：key1=val1&key2=val2&...&key=PAY_KEY → MD5 大写。 */
export function signYunGouOS(params: Record<string, string>, payKey: string): string {
  const sortedKeys = Object.keys(params).filter((k) => k !== 'sign').sort();
  const parts = sortedKeys.map((k) => `${k}=${params[k]}`);
  parts.push(`key=${payKey}`);
  // Node 自带 crypto，避免再引依赖
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.createHash('md5').update(parts.join('&'), 'utf8').digest('hex').toUpperCase();
}

type YunGouOSEnvelope<T> = {
  code: number;
  data: T | null;
  msg?: string;
};

/**
 * 创建 Native 扫码订单。
 * type=1 → data 返回 { codeUrl, qrcode }，codeUrl 即支付连接，
 *           前端用 qrcode 库把这个 URL 渲染成二维码图给用户扫。
 * amount 单位是元（保留两位小数）。
 *
 * channel 默认 'merge'：一码付，微信/支付宝通用。
 */
export async function createNativeOrder(opts: {
  outTradeNo: string;
  amount: number;
  body: string;
  attach?: string;
  channel?: PayChannel;
}): Promise<{ codeUrl: string; qrCodeImgUrl?: string }> {
  const { mchId, payKey, notifyUrl } = getConfig();
  const channel = opts.channel ?? 'merge';

  const params: Record<string, string> = {
    out_trade_no: opts.outTradeNo,
    total_fee: opts.amount.toFixed(2),
    mch_id: mchId,
    body: opts.body,
    type: '1',
    notify_url: notifyUrl,
  };
  if (opts.attach) params.attach = opts.attach;
  params.sign = signYunGouOS(params, payKey);

  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}${CHANNEL_ENDPOINT[channel]}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as YunGouOSEnvelope<{ codeUrl: string; qrcode?: string }>;
  if (json.code !== 0 || !json.data?.codeUrl) {
    throw new Error(`YunGouOS 下单失败(${channel})：${json.code} ${json.msg ?? 'unknown'}`);
  }
  return { codeUrl: json.data.codeUrl, qrCodeImgUrl: json.data.qrcode };
}

/**
 * 验签 YunGouOS 异步回调（form post）。
 * 返回 null 表示验签失败；成功则返回核心字段供上层入库。
 */
export type YunGouOSNotify = {
  outTradeNo: string;
  transactionId: string;
  totalFee: number;
  paySuccess: boolean;
};

export function verifyWebhookSign(payload: Record<string, string>): YunGouOSNotify | null {
  const payKey = process.env.YUNGOUOS_PAY_KEY;
  if (!payKey) return null;

  const remoteSign = payload.sign;
  if (!remoteSign) return null;

  const expected = signYunGouOS(payload, payKey);
  if (expected !== remoteSign) return null;

  // 文档：code=1 成功，code=0 失败
  if (payload.code !== '1') return null;

  const outTradeNo = payload.out_trade_no;
  const transactionId = payload.transaction_id ?? payload.order_no;
  const totalFeeStr = payload.total_fee ?? payload.money;
  if (!outTradeNo || !transactionId || !totalFeeStr) return null;

  const totalFee = Number(totalFeeStr);
  if (!Number.isFinite(totalFee) || totalFee <= 0) return null;

  return { outTradeNo, transactionId, totalFee, paySuccess: true };
}

/**
 * 主动查询订单（用于 webhook 漏推时的兜底补偿）。
 * channel 默认 'merge'。
 */
export async function queryOrder(
  outTradeNo: string,
  channel: PayChannel = 'merge'
): Promise<{
  paid: boolean;
  transactionId?: string;
  totalFee?: number;
} | null> {
  const { mchId, payKey } = getConfig();
  const params: Record<string, string> = {
    out_trade_no: outTradeNo,
    mch_id: mchId,
  };
  params.sign = signYunGouOS(params, payKey);
  const body = new URLSearchParams(params).toString();

  const res = await fetch(`${API_BASE}${CHANNEL_QUERY_ENDPOINT[channel]}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as YunGouOSEnvelope<{
    payStatus?: number | string;
    transaction_id?: string;
    total_fee?: string | number;
  }>;
  if (json.code !== 0 || !json.data) return null;
  const paid = String(json.data.payStatus) === '1' || String(json.data.payStatus) === 'SUCCESS';
  return {
    paid,
    transactionId: json.data.transaction_id,
    totalFee: json.data.total_fee != null ? Number(json.data.total_fee) : undefined,
  };
}
