import type { Metadata } from 'next';
import { RULES, RULES_META } from '@/lib/i18n/rules';
import { getServerLocale } from '@/lib/i18n/dict.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = RULES_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/rules' },
  };
}

export default async function RulesPage() {
  const locale = await getServerLocale();
  const list = RULES[locale];
  const meta = RULES_META[locale];

  return (
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
        {list.map((r) => (
          <div
            key={r.title}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <h2 className="text-[15px] font-medium" style={{ color: 'var(--accent)' }}>
              {r.title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              {r.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
