import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Leaderboard from '@/components/Leaderboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initial = await db
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

  return <Leaderboard initial={initial} />;
}
