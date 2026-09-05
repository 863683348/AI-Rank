/**
 * i18n 字典查找
 *
 * 用法：
 *   import { t } from '@/lib/i18n/dict';
 *   t('home.title', 'zh')           // → 'C 位的显眼包'
 *   t('home.title', 'en')           // → 'C-Spot Spotlight'（已翻译）
 *   t('home.subtitle', 'en')        // → 兜底为中文
 *
 * 设计：
 * - 缺失的 key 在所有 locale 都回退到中文，再缺失则返回 key 名（便于发现）
 * - 单文件导入，无运行时依赖
 */

import { useEffect, useState } from 'react';
import { zh, type DictKey } from './zh';
import { en } from './en';

export type Locale = 'zh' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['zh', 'en'];
export const DEFAULT_LOCALE: Locale = 'zh';

export function t(key: DictKey, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === 'en') {
    const v = en[key];
    if (v !== undefined) return v;
  }
  // 兜底到中文
  return zh[key] ?? key;
}

/** 读取用户偏好 locale（仅客户端使用） */
export function getClientLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem('toolsrank-locale');
  if (stored === 'zh' || stored === 'en') return stored;
  // 浏览器语言兜底
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

/** 持久化用户偏好 locale */
export function setClientLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('toolsrank-locale', locale);
  // 通知 layout / nav 重新渲染
  window.dispatchEvent(new CustomEvent('toolsrank-locale-change', { detail: locale }));
}

export { zh, en };
export type { DictKey };

/**
 * 订阅客户端 locale 变化（hook）
 * - 初始读 getClientLocale()
 * - 监听 toolsrank-locale-change 事件
 * - SSR 安全：服务端返回 DEFAULT_LOCALE，客户端挂载后 re-render
 */
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