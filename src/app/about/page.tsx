import type { Metadata } from 'next';
import Link from 'next/link';
import { ABOUT, ABOUT_META } from '@/lib/i18n/about';
import { getServerLocale } from '@/lib/i18n/dict.server';
import { breadcrumbJsonLd, FOUNDER, SITE_URL } from '@/lib/schema-org';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = ABOUT_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/about' },
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage() {
  const locale = await getServerLocale();
  const zh = locale === 'zh';
  const c = ABOUT[locale];

  // AboutPage + Person（真实运营者实体，sameAs 指向可验证的公开档案）
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${SITE_URL}/about#page`,
        url: `${SITE_URL}/about`,
        name: c.h1,
        inLanguage: zh ? 'zh-CN' : 'en',
        about: { '@id': `${SITE_URL}/#founder` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#founder`,
        name: FOUNDER.name,
        alternateName: FOUNDER.alternateName,
        email: FOUNDER.email,
        url: `${SITE_URL}/about`,
        jobTitle: zh ? '独立开发者 / ToolsRank 运营者' : 'Indie developer / ToolsRank operator',
        description: FOUNDER.description,
        knowsAbout: zh
          ? ['AI 工具', 'AI 编程', '独立开发', '产品增长']
          : ['AI tools', 'AI coding', 'indie hacking', 'product growth'],
        worksFor: { '@id': `${SITE_URL}/#org` },
        sameAs: [FOUNDER.github],
      },
      breadcrumbJsonLd([{ name: c.h1, path: '/about' }]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
            {c.h1}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
            {c.intro}
          </p>
        </header>

        <section
          aria-labelledby="about-who"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: '14px',
          }}
        >
          <h2
            id="about-who"
            className="text-[15px] font-semibold"
            style={{ marginTop: 0, marginBottom: 8 }}
          >
            {c.whoTitle}
          </h2>
          {c.whoBody.map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              {p}
            </p>
          ))}

          {/* 运营者名片 — sameAs 可验证来源 */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
              GitHub：
              <a href={FOUNDER.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                github.com/863683348
              </a>
            </li>
            <li className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
              {zh ? '微信公众号' : 'WeChat Official Account'}：{FOUNDER.wechatAccount}
            </li>
            <li className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
              {zh ? '知识星球' : 'Knowledge Planet'}：{FOUNDER.communityName}
            </li>
            <li className="text-[13px]" style={{ color: 'var(--fg-2)' }}>
              Email：
              <a href={`mailto:${FOUNDER.email}`} style={{ color: 'var(--accent)' }}>
                {FOUNDER.email}
              </a>
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="about-how"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: '14px',
          }}
        >
          <h2
            id="about-how"
            className="text-[15px] font-semibold"
            style={{ marginTop: 0, marginBottom: 8 }}
          >
            {c.howTitle}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {c.howItems.map((item, i) => (
              <li key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)', marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="about-trust"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: '14px',
          }}
        >
          <h2
            id="about-trust"
            className="text-[15px] font-semibold"
            style={{ marginTop: 0, marginBottom: 8 }}
          >
            {c.trustTitle}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {c.trustItems.map((item, i) => (
              <li key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)', marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="about-facts"
          style={{
            background: 'var(--surface-warm)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
          }}
        >
          <h2
            id="about-facts"
            className="text-[15px] font-semibold"
            style={{ marginTop: 0, marginBottom: 8 }}
          >
            {c.factLabel}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {c.facts.map((f) => (
                <tr key={f.label}>
                  <td
                    className="text-[13px]"
                    style={{ color: 'var(--meta)', padding: '6px 0', width: 120, verticalAlign: 'top' }}
                  >
                    {f.label}
                  </td>
                  <td className="text-[13px]" style={{ color: 'var(--fg-2)', padding: '6px 0' }}>
                    {f.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="text-[13px]" style={{ marginTop: 16 }}>
          <Link href="/" style={{ color: 'var(--accent)' }}>
            {zh ? '← 回到榜单' : '← Back to the board'}
          </Link>
        </p>
      </main>
    </>
  );
}
