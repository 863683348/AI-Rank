import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

/**
 * 主题防闪烁脚本：在 hydration 之前同步从 localStorage 恢复主题，
 * 保证首屏不闪。逻辑详见 ThemeToggle。
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('toolsrank-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // 等切换真正发生时再启用过渡，避免加载阶段整体闪烁
    requestAnimationFrame(function () {
      root.classList.add('theme-ready');
    });
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export const metadata: Metadata = {
  title: 'ToolsRank — C位的显眼包',
  description:
    'AI 工具竞价排行榜：金额即排名，花小钱上 C 位当显眼包。每一笔透明可审计，每日 00:00 重置。toolsrank.lol',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
