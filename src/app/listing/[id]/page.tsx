import { db } from '@/db';
import { listings, bids } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatMoney, timeAgo } from '@/lib/format';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

/** 产品详情页：公开竞价历史（透明审计） */
export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);

  if (!listing) {
    return (
      <main className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
        未找到该条目。<a href="/" style={{ color: 'var(--accent)' }}>返回榜单</a>
      </main>
    );
  }

  const history = await db
    .select({ amount: bids.amount, method: bids.paymentMethod, createdAt: bids.createdAt })
    .from(bids)
    .where(eq(bids.listingId, id))
    .orderBy(desc(bids.createdAt))
    .limit(50);

  const confirmed = history.filter((b) => b.amount !== null);

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
      <a href="/" className="text-[13px]" style={{ color: 'var(--accent)' }}>
        ← 返回榜单
      </a>

      <header
        className="mt-4 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px' }}
      >
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          {listing.name}
        </h1>
        {listing.description && (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {listing.description}
          </p>
        )}
        <a
          href={`/api/v1/click/${listing.id}`}
          target="_blank"
          rel="noopener nofollow"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px]"
          style={{ color: 'var(--accent)' }}
        >
          <ExternalLink size={13} aria-hidden />
          访问工具
        </a>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>当前在榜金额</div>
            <div className="font-mono text-lg font-semibold" style={{ color: 'var(--fg-2)' }}>
              {formatMoney(listing.bidAmount)}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>累计投入</div>
            <div className="font-mono text-lg" style={{ color: 'var(--fg-2)' }}>
              {formatMoney(listing.lifetimeAmount)}
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'var(--meta)' }}>出站点击</div>
            <div className="font-mono text-lg" style={{ color: 'var(--fg-2)' }}>
              {listing.totalClicks}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4">
        <h2 className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
          竞价历史（公开）
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {confirmed.length === 0 && (
            <li className="text-[13px]" style={{ color: 'var(--meta)' }}>
              暂无记录
            </li>
          )}
          {confirmed.map((b, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg text-[13px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', padding: '9px 14px' }}
            >
              <span className="font-mono" style={{ color: 'var(--fg-2)' }}>
                +{formatMoney(b.amount)}
              </span>
              <span style={{ color: 'var(--meta)' }}>
                {b.method === 'yungouos' ? '微信/支付宝' : b.method} · {timeAgo(new Date(b.createdAt).toISOString())}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
