import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Leaderboard from '@/components/Leaderboard';
import { isKnownCategory } from '@/lib/categories';

export const dynamic = 'force-dynamic';

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
        .where(eq(listings.category, filter))
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
        .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
        .limit(100);

  return <Leaderboard initial={rows} activeCategory={filter} />;
}
