import type { Locale } from './i18n/dict';

/**
 * 金额格式化：按 locale 切换币种符号，**数字不变，仅换单位**
 * - zh: ¥1,234.56
 * - en: $1,234.56
 *
 * 「已进账部分按实际计算」语义：金额原值即 DB 里的 yungouos 实收人民币数，
 * 不做汇率换算；英文页显示的 $ 仅为符号占位（与人民币数值相同）。
 */
export function formatMoney(v: string | number, locale: Locale = 'zh'): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return locale === 'zh' ? '¥0.00' : '$0.00';
  const numStr = n.toLocaleString('en-US', {
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
