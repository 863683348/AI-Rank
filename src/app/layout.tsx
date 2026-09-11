import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { gtagScript, clarityScript, ga4Id, clarityId } from '@/lib/analytics';
import { siteGraph } from '@/lib/schema-org';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toolsrank.lol';

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('toolsrank-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    requestAnimationFrame(function () {
      root.classList.add('theme-ready');
    });
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ToolsRank — C 位的显眼包',
    template: '%s · ToolsRank',
  },
  description:
    'AI 工具竞价排行榜：金额即排名，花小钱上 C 位当显眼包。每一笔透明可审计，每日 00:00 重置。',
  applicationName: 'ToolsRank',
  keywords: ['AI 工具', '竞价排行榜', 'AI 工具导航', '显眼包', 'C 位', 'ToolsRank'],
  authors: [{ name: '大飞象 (Dafeixiang)', url: `${SITE_URL}/about` }],
  creator: '大飞象 (Dafeixiang)',
  publisher: 'ToolsRank',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'ToolsRank',
    title: 'ToolsRank — C 位的显眼包',
    description: 'AI 工具竞价排行榜，金额即名次。',
    url: SITE_URL,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolsRank — C 位的显眼包',
    description: 'AI 工具竞价排行榜，金额即名次。',
  },
  // 刻意不在此声明 alternates：
  // 1) layout 级的 canonical 会被「没有自设 canonical」的子页面整页继承，
  //    导致 /gpt6、/dsh 等页面的 canonical 指向首页，被判为重复内容而不被索引；
  // 2) 本站 i18n 是 localStorage 客户端切换，不存在 /en 这类独立 URL，
  //    声明 hreflang="en" 会指向 404（GSC 报「无效的 hreflang」）。
  // 结论：canonical 一律由各页面自己声明（'/'、'/about'、'/gpt6' …）。
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08090a' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtag = gtagScript();
  const clarity = clarityScript();
  const ga = ga4Id();
  const cl = clarityId();
  const siteJsonLd = JSON.stringify(siteGraph()).replace(/</g, '\\u003c');

  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: siteJsonLd }}
        />
      </head>
      <body>
        <Nav />
        {children}
        <Footer />

        {/* GA4 — 仅生产加载，localhost/preview 不上报 */}
        {ga && gtag && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: gtag }} />
          </>
        )}

        {/* Microsoft Clarity — 仅生产加载 */}
        {cl && clarity && (
          <Script id="clarity-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: clarity }} />
        )}
      </body>
    </html>
  );
}