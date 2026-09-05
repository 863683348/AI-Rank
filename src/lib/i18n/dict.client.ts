'use client';

/**
 * 客户端 locale hook（订阅变化）
 * - 初始读 getClientLocale()
 * - 监听 toolsrank-locale-change 事件
 * - SSR 安全：服务端返回 DEFAULT_LOCALE，客户端挂载后 re-render
 */

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, getClientLocale, type Locale } from './dict';

export function useClientLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    setLocale(getClientLocale());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Locale>).detail;
      if (next === 'zh' || next === 'en') setLocale(next);
    };
    window.addEventListener('toolsrank-locale-change', onChange);
    return () => window.removeEventListener('toolsrank-locale-change', onChange);
  }, []);
  return locale;
}