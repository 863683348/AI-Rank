/**
 * i18n 字典查找（universal，无 React hook，无 next/headers 依赖）
 *
 * 用法：
 *   import { t } from '@/lib/i18n/dict';
 *   t('home.title', 'zh')           // → 'C 位的显眼包'
 *   t('home.title', 'en')           // → 'C-Spot Spotlight'（已翻译）
 *   t('home.subtitle', 'en')        // → 兜底到中文
 *
 * 客户端 hook：useClientLocale → 从 './dict.client' 引
 * 服务端读取：getServerLocale  → 从 './dict.server' 引
 */

import { zh, type DictKey } from './zh';
import { en } from './en';

export type Locale = 'zh' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['zh', 'en'];
export const DEFAULT_LOCALE: Locale = 'zh';

export const LOCALE_COOKIE = 'toolsrank-locale';

export function t(key: DictKey, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === 'en') {
    const v = en[key];
    if (v !== undefined) return v;
  }
  // 兜底到中文
  return zh[key] ?? key;
}

/** 解析 locale 字符串 → 合法 Locale，不合法返回 DEFAULT */
export function parseLocale(raw: string | undefined | null): Locale {
  if (raw === 'zh' || raw === 'en') return raw;
  return DEFAULT_LOCALE;
}

/**
 * 读取用户偏好 locale（仅客户端使用）
 * 优先级：localStorage → 浏览器语言 → 默认 zh
 */
export function getClientLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_COOKIE);
  if (stored === 'zh' || stored === 'en') return stored;
  // 浏览器语言兜底
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

/**
 * 持久化用户偏好 locale
 * 同时写 localStorage（客户端持久）+ cookie（让 server component / SSR 能读到）
 */
export function setClientLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_COOKIE, locale);
  // 写 cookie，path=/, max-age=1y。SameSite=Lax（GET 也带）。
  // 注：next/headers 在 server 可读；client 写 document.cookie。
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  // 通知 layout / nav 重新渲染
  window.dispatchEvent(new CustomEvent('toolsrank-locale-change', { detail: locale }));
}

export { zh, en };
export type { DictKey };