import Link from 'next/link';
import type { Metadata } from 'next';
import {
  CONTACTS,
  CONTACT_META,
  CONTACT_CTA_TITLE,
  CONTACT_CTA_BODY,
  CONTACT_CTA_LINK,
} from '@/lib/i18n/contact';
import { getServerLocale } from '@/lib/i18n/dict.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = CONTACT_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/contact' },
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage() {
  const locale = await getServerLocale();
  const list = CONTACTS[locale];
  const meta = CONTACT_META[locale];

  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          {meta.title}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          {meta.subtitle}
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.map((c) => (
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
                {c.ctaLabel}
              </Link>
            ) : (
              <span className="text-[12px]" style={{ color: 'var(--meta)' }}>
                {c.ctaLabel}
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
          <strong style={{ color: 'var(--fg)' }}>{CONTACT_CTA_TITLE[locale]}</strong>{' '}
          {(() => {
            const before = CONTACT_CTA_BODY[locale].split('{link}')[0];
            const after = CONTACT_CTA_BODY[locale].split('{link}')[1];
            return (
              <>
                {before}
                <Link href="/" style={{ color: 'var(--accent)' }}>
                  {CONTACT_CTA_LINK[locale]}
                </Link>
                {after}
              </>
            );
          })()}
        </p>
      </div>
    </main>
  );
}
