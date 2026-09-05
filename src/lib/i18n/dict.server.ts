/**
 * 服务端 locale 读取（仅 server component / route handler 用）
 * 优先级：cookie → Accept-Language → 默认 zh
 */

import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, type Locale } from './dict';

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get(LOCALE_COOKIE)?.value;
    if (c) return parseLocale(c);
  } catch {
    // cookies() 在非 server context 抛错；吞掉走 fallback
  }
  try {
    const h = await headers();
    const accept = h.get('accept-language') ?? '';
    const first = accept.split(',')[0]?.trim().toLowerCase();
    if (first?.startsWith('en')) return 'en';
    if (first?.startsWith('zh')) return 'zh';
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}