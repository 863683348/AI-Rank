'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
      }}
    >
      <CheckCircle2 size={48} style={{ color: 'var(--success)' }} aria-hidden />
      <h1 className="mt-4 text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
        支付成功
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: 'var(--muted)' }}>
        你的出价已提交，榜单会通过实时通道自动刷新。回到首页即可看到最新排名。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg text-sm font-medium"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-on)',
          padding: '11px 22px',
          textDecoration: 'none',
        }}
      >
        返回首页看榜单
      </Link>
    </main>
  );
}
