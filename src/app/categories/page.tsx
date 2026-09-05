import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '分类榜单',
  description: 'ToolsRank 按 AI 工具类型分桶的子榜单：图像、文本、代码、语音、视频。',
  alternates: { canonical: '/categories' },
};

type Row = {
  id: string;
  name: string;
  url: string;
  iconUrl: string | null;
  category: string;
  bidAmount: string;
  lifetimeAmount: string;
  totalClicks: number;
};

export default async function CategoriesPage() {
  const all: Row[] = await db
    .select({
      id: listings.id,
      name: listings.name,
      url: listings.url,
      iconUrl: listings.iconUrl,
      category: listings.category,
      bidAmount: listings.bidAmount,
      lifetimeAmount: listings.lifetimeAmount,
      totalClicks: listings.totalClicks,
    })
    .from(listings)
    .orderBy(desc(listings.bidAmount));

  const groups: Record<string, Row[]> = {};
  for (const l of all) (groups[l.category] ??= []).push(l);

  const ordered = CATEGORIES.map((c) => ({
    ...c,
    items: groups[c.slug] ?? [],
  }));

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          分类榜单
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          按工具类型分桶。点分类卡片进入对应榜单，或在提交工具时选择分类。
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {ordered.map((cat) => {
          const count = cat.items.length;
          const onBoard = cat.items.reduce(
            (s, l) => s + parseFloat(l.bidAmount),
            0
          );
          const top = cat.items[0];
          return (
            <Link
              key={cat.slug}
              href={count > 0 ? `/?cat=${cat.slug}` : '/'}
              style={{
                textDecoration: 'none',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                opacity: count > 0 ? 1 : 0.55,
                transition: 'border-color .15s',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium">{cat.label}</span>
                <span
                  className="font-mono text-[13px]"
                  style={{ color: 'var(--meta)' }}
                >
                  {count} 项
                </span>
              </div>

              {top ? (
                <>
                  <div className="truncate text-[13px]" style={{ color: 'var(--fg-2)' }}>
                    {top.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[15px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {formatMoney(top.bidAmount)}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--meta)' }}>
                      在榜 {formatMoney(onBoard)}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                  暂无工具
                </span>
              )}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
