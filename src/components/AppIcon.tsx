'use client';

import { useState } from 'react';

/**
 * 工具图标 — 永不裂图的三级兜底：
 * 1. iconUrl（后台可指定）
 * 2. /api/v1/favicon?d=域名（服务端代理抓取，国内访客不受墙影响）
 * 3. 首字母色块（前两级都挂时，按名字哈希取色）
 * alt 恒为空，避免裂图时浏览器把名字当 tooltip 弹出来。
 */

const PALETTE = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function avatarFor(name: string, size: number): React.ReactNode {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const bg = PALETTE[hash % PALETTE.length];
  const letter = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <div
      aria-hidden
      className="flex shrink-0 select-none items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.28)),
        background: bg,
        color: '#fff',
        fontSize: Math.round(size * 0.5),
        lineHeight: 1,
      }}
    >
      {letter}
    </div>
  );
}

export default function AppIcon({
  name,
  url,
  iconUrl,
  size = 40,
  className = '',
  style,
}: {
  name: string;
  url: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = '';
  }
  const src = iconUrl || (domain ? `/api/v1/favicon?d=${encodeURIComponent(domain)}` : '');

  if (!src || failed) return avatarFor(name, size);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 ${className}`}
      style={{
        background: 'var(--surface-warm)',
        border: '1px solid var(--border)',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}
