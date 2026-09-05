import Link from 'next/link';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import Leaderboard from '@/components/Leaderboard';
import { getTopic } from '@/lib/topics';

export const dynamic = 'force-dynamic';

/** 专题落地页：SEO hero + 专题竞价榜（金额即排名，编辑收录条目象征性 $2） */
export default async function TopicPage({ slug }: { slug: string }) {
  const topic = getTopic(slug);
  if (!topic) return null;

  const rows = await db
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
    .where(and(eq(listings.category, slug), eq(listings.status, 'approved')))
    .orderBy(desc(listings.bidAmount), desc(listings.lastBidAt))
    .limit(100);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <header
        className="rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px 24px' }}
      >
        <span
          className="inline-block rounded-full text-[11px]"
          style={{ background: 'var(--surface-warm)', color: 'var(--accent)', border: '1px solid var(--border)', padding: '3px 10px', letterSpacing: '0.06em' }}
        >
          专题
        </span>
        <h1 className="mt-3 text-2xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          {topic.h1}
        </h1>
        {topic.intro.map((p, i) => (
          <p key={i} className="mt-2 text-[13px]" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            {p}
          </p>
        ))}
        <Link
          href={`/?cat=${topic.slug}`}
          className="mt-4 inline-block rounded-lg text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            padding: '11px 20px',
            textDecoration: 'none',
          }}
        >
          {topic.cta}
        </Link>
      </header>

      <div className="mt-6">
        <Leaderboard initial={rows} activeCategory={topic.slug} defaultCategory={topic.slug} />
      </div>
    </main>
  );
}
