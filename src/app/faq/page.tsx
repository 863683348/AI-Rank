import type { Metadata } from 'next';
import { FAQ, FAQ_META } from '@/lib/i18n/faq';
import { getServerLocale } from '@/lib/i18n/dict.server';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/schema-org';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = FAQ_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/faq' },
  };
}

export default async function FaqPage() {
  const locale = await getServerLocale();
  const list = FAQ[locale];
  const meta = FAQ_META[locale];

  const jsonLd = JSON.stringify([
    faqPageJsonLd(list),
    breadcrumbJsonLd([{ name: meta.title, path: '/faq' }]),
  ]).replace(/</g, '\\u003c');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          {meta.title}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          {meta.description}
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.map((f, i) => (
          <details
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <summary
              className="text-[14px] font-medium"
              style={{ cursor: 'pointer', color: 'var(--fg)', listStyle: 'none' }}
            >
              {f.q}
            </summary>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              {f.a}
            </p>
          </details>
        ))}
      </section>
      </main>
    </>
  );
}
