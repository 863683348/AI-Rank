'use client';

import Link from 'next/link';
import { useClientLocale } from '@/lib/i18n/dict.client';
import { categoryLabel, type Category } from '@/lib/categories';
import { formatMoney } from '@/lib/format';

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

export type CategoryGroup = Category & { items: Row[] };

export default function CategoriesView({ groups }: { groups: CategoryGroup[] }) {
  const locale = useClientLocale();
  const isEn = locale === 'en';

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          {isEn ? 'Categories' : '分类榜单'}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          {isEn
            ? 'Grouped by tool type. Tap a card to open its leaderboard, or pick a category when submitting a tool.'
            : '按工具类型分桶。点分类卡片进入对应榜单，或在提交工具时选择分类。'}
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {groups.map((cat) => {
          const count = cat.items.length;
          const onBoard = cat.items.reduce((s, l) => s + parseFloat(l.bidAmount), 0);
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
                <span className="text-[15px] font-medium">{categoryLabel(cat.slug, locale)}</span>
                <span className="font-mono text-[13px]" style={{ color: 'var(--meta)' }}>
                  {count} {isEn ? 'items' : '项'}
                </span>
              </div>

              {top ? (
                <>
                  <div className="truncate text-[13px]" style={{ color: 'var(--fg-2)' }}>
                    {top.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[15px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {formatMoney(top.bidAmount, locale)}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--meta)' }}>
                      {isEn ? 'On board ' : '在榜 '}{formatMoney(onBoard, locale)}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                  {isEn ? 'No tools yet' : '暂无工具'}
                </span>
              )}
            </Link>
          );
        })}
      </section>
    </main>
  );
}