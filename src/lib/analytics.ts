/**
 * 分析与监控埋点（仅生产加载）
 *
 * 设计：
 * - gtag.js (GA4) + Microsoft Clarity 脚本通过环境变量控制是否启用
 * - 仅在生产 + Vercel 主环境加载，避免 localhost/预览污染
 * - 关键事件命名：动词_对象（pay_complete、listing_submit、bid_start、click_out、reset_completed）
 *
 * 环境变量（.env / Vercel）：
 *   NEXT_PUBLIC_GA4_ID          GA4 Measurement ID  G-XXXXXXXX
 *   NEXT_PUBLIC_CLARITY_ID      Clarity Project ID  （可选）
 *
 * 用法：
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('pay_complete', { listingId, amount, method: 'yungouos' });
 */

export const isProd = (): boolean => {
  // 排除 localhost / Vercel Preview
  if (process.env.NODE_ENV !== 'production') return false;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return false;
  return true;
};

export const ga4Id = (): string | null => {
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  return id && id.startsWith('G-') ? id : null;
};

export const clarityId = (): string | null => {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  return id && /^[a-z0-9]+$/i.test(id) ? id : null;
};

/** 触发 GA4 事件。客户端安全，不传服务端 token。 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const id = ga4Id();
  if (!id) return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag !== 'function') return;
  w.gtag('event', name, params);
}

/**
 * 在 <head> 中注入 gtag 脚本（含 Consent 默认 denied，尊重 GDPR）。
 * 仅 isProd() 时调用，否则返回 null（不渲染）。
 */
export function gtagScript(): string | null {
  if (!isProd()) return null;
  const id = ga4Id();
  if (!id) return null;
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'granted' });
gtag('config', '${id}', { send_page_view: true });
`.trim();
}

/** Clarity 注入脚本（动态 lazy load）。仅 isProd() 时返回。 */
export function clarityScript(): string | null {
  if (!isProd()) return null;
  const id = clarityId();
  if (!id) return null;
  return `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${id}");
`.trim();
}