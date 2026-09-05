import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ToolsRank — C位的显眼包',
  description:
    'AI 工具竞价排行榜：金额即排名，花小钱上 C 位当显眼包。每一笔透明可审计，每日 00:00 重置。toolsrank.lol',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
