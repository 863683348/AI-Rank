import type { Metadata } from 'next';

// 支付结果页：无独立检索价值，明确排除索引，避免稀释站点质量信号。
// （page.tsx 是 'use client'，无法直接 export metadata，故用 layout 承载。）
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
