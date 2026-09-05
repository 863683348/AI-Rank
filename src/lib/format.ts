/** 金额格式化：¥1,234.56（等宽字体在组件层处理） */
export function formatMoney(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 相对时间：3 分钟前 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
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
