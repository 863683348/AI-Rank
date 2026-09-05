import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import type { Metadata } from 'next';
import Leaderboard from '@/components/Leaderboard';
import { isKnownCategory } from '@/lib/categories';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toolsrank.lol';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'C 位的显眼包 — AI 工具竞价实时榜',
  description:
    'ToolsRank 是 AI 工具竞价排行榜。每一笔透明可审计，每日 00:00 重置金额。花小钱上 C 位、当显眼包。',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'C 位的显眼包 — AI 工具竞价实时榜',
    description: 'AI 工具竞价排行榜，金额即名次。',
    url: SITE_URL,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const filter = cat && isKnownCategory(cat) ? cat : null;

  const rows = filter
    ? await db
        .select({
          id: listings.id,
          name: listings.name,
          url: listings.url,
          description: listings.description,
          iconUrl: listings.iconUrl,
          bidAmount: listings.bidAmount,
          lifetimeAmount: listings.lifetimeAmount,
          totalClicks: listings.totalClicks,
          lastBidAt: listings.lastBidAt,
        })
        .from(listings)
        .where(and(eq(listings.category, filter), eq(listings.status, 'approved')))
        .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
        .limit(100)
    : await db
        .select({
          id: listings.id,
          name: listings.name,
          url: listings.url,
          description: listings.description,
          iconUrl: listings.iconUrl,
          bidAmount: listings.bidAmount,
          lifetimeAmount: listings.lifetimeAmount,
          totalClicks: listings.totalClicks,
          lastBidAt: listings.lastBidAt,
        })
        .from(listings)
        .where(eq(listings.status, 'approved'))
        .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
        .limit(100);

  // JSON-LD：Organization + WebSite + ItemList（搜索引擎富卡片）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: 'ToolsRank',
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: 'AI 工具竞价排行榜',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#site`,
        url: SITE_URL,
        name: 'ToolsRank',
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'ItemList',
        name: 'AI 工具竞价排行榜',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 10).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: r.name,
            url: r.url,
            description: r.description ?? undefined,
            applicationCategory: 'AIApplication',
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Leaderboard initial={rows} activeCategory={filter} />
    </>
  );
}