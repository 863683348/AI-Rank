'use client';

/**
 * 语言切换器（客户端组件）
 *
 * 接入 dict.ts 的 useClientLocale hook，订阅 toolsrank-locale-change 事件。
 * 切换会写 localStorage 并派发事件；所有消费 t(key, locale) 的组件会同步刷新。
 *
 * 设计：
 * - 仅 zh ↔ en 两个选项
 * - localStorage 持久化
 * - SSR 安全：服务端返回 zh，挂载后客户端 re-render 为浏览器/已选语言
 */

import { Languages } from 'lucide-react';
import { setClientLocale, useClientLocale, type Locale } from '@/lib/i18n/dict';

export default function LangSwitcher() {
  const locale = useClientLocale();

  const toggle = () => {
    const next: Locale = locale === 'zh' ? 'en' : 'zh';
    setClientLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="tap-target"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--fg-2)',
        padding: '6px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      aria-label={`Switch language, current: ${locale === 'zh' ? '中文' : 'English'}`}
      title="切换语言（中 / EN）— V1.1 完整生效"
    >
      <Languages size={14} aria-hidden />
      <span style={{ letterSpacing: '0.06em' }}>{locale === 'zh' ? '中' : 'EN'}</span>
    </button>
  );
}