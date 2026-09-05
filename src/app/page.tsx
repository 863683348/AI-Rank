import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import type { Metadata } from 'next';
import Leaderboard from '@/components/Leaderboard';
import { isKnownCategory } from '@/lib/categories';
import { itemListJsonLd } from '@/lib/schema-org';

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

  // JSON-LD：ItemList（Organization/WebSite 由 layout 全站注入，这里不重复）
  const jsonLd = JSON.stringify(
    itemListJsonLd(rows),
  ).replace(/</g, '\\u003c');

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