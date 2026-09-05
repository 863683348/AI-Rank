import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Nav from '@/components/Nav';
import { gtagScript, clarityScript, ga4Id, clarityId } from '@/lib/analytics';

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
  authors: [{ name: 'ToolsRank' }],
  creator: 'ToolsRank',
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
  alternates: {
    canonical: SITE_URL,
  },
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

  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Nav />
        {children}

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