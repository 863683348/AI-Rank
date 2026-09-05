import type { Locale } from './i18n/dict';

/**
 * V1.2 起：金额单位统一为美元（USD）。
 * 全局以 $ 展示，zh / en 页一致，不再做汇率换算。
 */
// 汇率换算已废弃：全局统一以美元（USD、$）展示，zh / en 页一致，不再做 USD→CNY 转换。

/**
 * 金额格式化
 * @param v DB 存的美元数值（number 或 numeric string）
 * @param _locale 保留参数以兼容旧调用，符号统一 $
 * @returns $N.NN
 */
export function formatMoney(v: string | number, _locale: Locale = 'en'): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return '$0.00';
  const numStr = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // 千分位统一用 en-US 的「,」，避免 zh-CN 在部分浏览器渲染成「\xa0」
  return `$${numStr}`;
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
