import type { Locale } from './i18n/dict';

/**
 * V1.2 起：金额单位统一为美元（USD）。
 * - zh 页：DB 美元值 × USD→CNY 汇率 → 显示 ¥
 * - en 页：DB 美元值直接显示 $
 * - 用户实际付的都是美元（标价 ₿N × 汇率 仅供阅读参考）
 *
 * 汇率来源（优先级）：
 *   1. 环境变量 USD_CNY_RATE（推荐：cron 每日刷一次）
 *   2. 默认 7.20（≈ 当前 USD/CNY 中间价近似值，仅作兜底）
 *
 * 接法（待办）：
 *   - V1.3 cron 抓 frankfurter.app / open.er-api.com 写入 settings 表
 *   - 现在先用 env，符合「先能跑，再追精度」
 */
const USD_CNY = Number.parseFloat(
  process.env.USD_CNY_RATE ?? '7.20',
) || 7.20;

export function getUsdToCnyRate(): number {
  return USD_CNY;
}

/**
 * 金额格式化（V1.2）
 * @param v DB 存的美元数值（number 或 numeric string）
 * @param locale 'zh' | 'en'
 * @returns zh=¥N.NN（已乘汇率） / en=$N.NN
 */
export function formatMoney(v: string | number, locale: Locale = 'zh'): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return locale === 'zh' ? '¥0.00' : '$0.00';
  const display = locale === 'zh' ? n * USD_CNY : n;
  const numStr = display.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // 千分位统一用 en-US 的「,」，避免 zh-CN 在部分浏览器渲染成「\xa0」
  return `${locale === 'zh' ? '¥' : '$'}${numStr}`;
}

/** 相对时间：3 分钟前（中文）/ 3 min ago（英文） */
export function timeAgo(iso: string, locale: Locale = 'zh'): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (locale === 'en') {
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    return `${Math.floor(h / 24)} d ago`;
  }
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

/** 距离下一个北京时间 00:00 的毫秒数 */
export function msUntilMidnightBeijing(now = Date.now()): number {
  const bjNow = new Date(now + 8 * 3600_000);
  const next = Date.UTC(
    bjNow.getUTCFullYear(),
    bjNow.getUTCMonth(),
    bjNow.getUTCDate() + 1,
    0, 0, 0
  );
  return next - (bjNow.getTime());
}
