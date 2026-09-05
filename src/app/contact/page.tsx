import Link from 'next/link';
import type { Metadata } from 'next';

const CONTACTS = [
  {
    label: '商务 / 合作邮箱',
    value: '863683348@qq.com',
    href: 'mailto:863683348@qq.com',
  },
  {
    label: '微信公众号',
    value: '大飞象的智能体2025',
    href: null,
  },
  {
    label: '知识星球',
    value: '大飞象AI陪你成长',
    href: null,
  },
];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '联系我',
  description: 'ToolsRank 商务合作、上架咨询、退款核对的联系方式。',
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          联系我
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          合作、上架咨询、退款核对，都可以通过下面任一方式找到我。
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CONTACTS.map((c) => (
          <div
            key={c.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div className="text-[12px]" style={{ color: 'var(--muted)' }}>
                {c.label}
              </div>
              <div className="mt-1 text-[15px] font-medium">{c.value}</div>
            </div>
            {c.href ? (
              <Link
                href={c.href}
                style={{
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--accent-on)',
                  background: 'var(--accent)',
                  padding: '8px 14px',
                  borderRadius: 8,
                }}
              >
                发邮件
              </Link>
            ) : (
              <span
                className="text-[12px]"
                style={{ color: 'var(--meta)' }}
              >
                站内搜索关注
              </span>
            )}
          </div>
        ))}
      </section>

      <div
        style={{
          marginTop: 20,
          background: 'var(--surface-warm)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
        }}
      >
        <p className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
          想让自己的 AI 工具上 C 位？直接去{' '}
          <Link href="/" style={{ color: 'var(--accent)' }}>
            榜单首页
          </Link>{' '}
          点「提交新工具」，¥1 起竞价，支付完立即生效。
        </p>
      </div>
    </main>
  );
}
